// worker.js
const registerWebworker = require('webworker-promise/lib/register')
const { Noise } = require('noisejs')


let noise

const adjustBiomeSettings = (biome, params) => {
  if (biome.biome === 1) {
    return Object.assign({}, params, {
      minHeight: params.minHeight - biome.frequency * 2,
    })
  }
  else if (biome.biome === 2) {
    return Object.assign({}, params, {
      minHeight: params.minHeight + biome.frequency * 2,
      redistribution: params.redistribution + biome.frequency / 4,
    })
  }
  return params
}

const genSurfacePoint = (
  position,
  { frequency, redistribution, octaves, octavesCoef, minHeight, maxHeight }
) => {
  const [x, z] = position
  let noiseValue = 0

  for (let o = 0; o < octaves - octaves / 3; o++) {
    noiseValue +=
      Math.pow(octavesCoef, o + 1) *
      noise.simplex2(
        x / frequency[0] / Math.pow(octavesCoef, o),
        z / frequency[1] / Math.pow(octavesCoef, o)
      )
  }

  for (let o = octaves - octaves / 3; o < octaves; o++) {
    noiseValue +=
      Math.pow(octavesCoef, o + 1) *
      noise.perlin2(
        x / frequency[0] / Math.pow(octavesCoef, o),
        z / frequency[1] / Math.pow(octavesCoef, o)
      )
  }

  const coef = 1 + Math.pow(octavesCoef, octaves)

  const normalized = (noiseValue + coef) / (coef * 2)
  const redistributed = Math.pow(normalized, redistribution)
  const adjusted = minHeight + redistributed * (maxHeight - minHeight) // 0 - 1

  return Math.round(adjusted)
}

const genCavesPoint = (position, { frequency, redistribution, octaves, octavesCoef }) => {
  const [x, y, z] = position
  let noiseValue = 0

  for (let o = 0; o < octaves; o++) {
    noiseValue +=
      Math.pow(octavesCoef, o + 1) *
      noise.perlin3(
        x / frequency[0] / Math.pow(octavesCoef, o),
        y / frequency[1] / Math.pow(octavesCoef, o),
        z / frequency[2] / Math.pow(octavesCoef, o)
      )
  }

  const coef = 1 + Math.pow(octavesCoef, octaves)

  const normalized = (noiseValue + coef) / (coef * 2) // 0 - 1
  const redistributed = Math.pow(normalized, redistribution)

  return Math.round(redistributed)
}

const genChunk3 = ({ position, chunkSize, chunkDepth, caves, surface }, emit) => {
  const [xStart, zStart] = Object.values(position).map((v) => v * chunkSize)
  const [xEnd, zEnd] = Object.values(position).map((v) => v * chunkSize + chunkSize)

  for (let x = xStart; x < xEnd; x++) {
    for (let z = zStart; z < zEnd; z++) {
      const column = new Uint8Array(chunkDepth)
      const height = genSurfacePoint([x, z], surface)

      for (let y = 0; y < chunkDepth; y++) {
        if (y <= height) {
          // column[y] = genCavesPoint([x, y, z], caves)
          column[y] = 1
        }
        else {
          column[y] = 0
        }
      }

      emit('column', {
        height,
        data: column.buffer,
      })
    }
  }

  return true
}

registerWebworker(async ({ type, payload }, emit) => {
  if (type === 'init') {
    noise = new Noise(payload)

    return true
  }
  else if (type === 'genChunk3') {
    return genChunk3(payload, emit)
  }

  return false
})
