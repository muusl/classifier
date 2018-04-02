// import { Network } from "network"

// const loadImage = require.context("./spectograms", true)

// const img = loadImage("./blues/blues.00000.png")
// const img = loadImage("./blues/blues.00000.png")

var fs = require("fs"),
  PNG = require("pngjs").PNG

const genres = [
  "blues",
  "classical",
  "country",
  "disco",
  "hiphop",
  "jazz",
  "metal",
  "pop",
  "reggae",
  "rock",
]

const loadSongUrl = require.context("./spectograms/", true, /.*/)

function loadImage(url) {
  return new Promise(resolve => {
    let width, height
    fs
      .createReadStream(url)
      .pipe(new PNG())
      .on("metadata", data => {
        width = data.width
        height = data.height
      })
      .on("parsed", data => {
        const arr = []
        for (let i = 0; i < data.length; i += 4) {
          arr.push(data[i])
        }
        resolve({
          width,
          height,
          data: arr,
        })
      })
  })
}

function oneHot(genre) {
  const a = Array(genres.length).fill(0)
  a[genres.indexOf(genre)] = 1
  return a
}

async function loadSong(genre, number) {
  const filename = `./${genre}/${genre}.${number}.png`
  const url = loadSongUrl(filename)
  const { width, height, data } = await loadImage(url)

  const pixelsPerSecong = 600 / 30
  const secondsPerChunk = 3
  const chunkWidth = pixelsPerSecong * secondsPerChunk
  const chunkCount = Math.floor(width / chunkWidth)
  const chunkedImage = []

  for (let i = 0; i < width; i += chunkWidth) {
    let chunk = []
    // j=1 to chop off first layer to make image even height :)
    for (let j = 1; j < height; j++) {
      let idx = j * width + i
      chunk = chunk.concat(data.slice(idx, idx + chunkWidth))
    }
    chunkedImage.push(chunk)
  }

  const chunkedLabels = chunkedImage.map(() => oneHot(genre))

  return {
    data: chunkedImage,
    labels: chunkedLabels,
  }
}

export async function load(count) {
  const genreNumbers = {}
  genres.forEach(
    genre =>
      (genreNumbers[genre] = Array(100)
        .fill(null)
        .map((_, i) => {
          let str = i + ""
          str =
            Array(5 - str.length)
              .fill("0")
              .join("") + str
          return str
        }))
  )

  let finalData = []
  let finalLabels = []

  let genreIdx = 0
  for (let i = 0; i < count; i++) {
    const genre = genres[genreIdx]
    const idx = Math.floor(Math.random() * genreNumbers[genre].length)
    const id = genreNumbers[genre].splice(idx, 1)[0]

    const { data, labels } = await loadSong(genre, id)

    finalData = finalData.concat(data)
    finalLabels = finalLabels.concat(labels)

    genreIdx = (genreIdx + 1) % genres.length
  }

  let idx = finalData.length - 1
  while (idx) {
    const randIdx = Math.floor(Math.random() * idx)
    finalData.push(finalData.splice(randIdx, 1)[0])
    finalLabels.push(finalLabels.splice(randIdx, 1)[0])
    idx--
  }

  return {
    data: finalData,
    labels: finalLabels,
  }

  debugger
}

export function split(
  { data, labels },
  [trainingSplit, validationSplit, testSplit]
) {
  const tot = trainingSplit + validationSplit + testSplit
  const trainingPerc = trainingSplit / tot
  const validationPerc = validationSplit / tot
  const trainingIdx = Math.floor(data.length * trainingPerc)
  const validationIdx = trainingIdx + Math.floor(data.length * validationPerc)

  const trainingData = data.slice(0, trainingIdx)
  const validationData = data.slice(trainingIdx, validationIdx)
  const testData = data.slice(validationIdx)

  const trainingLabels = labels.slice(0, trainingIdx)
  const validationLabels = labels.slice(trainingIdx, validationIdx)
  const testLabels = labels.slice(validationIdx)

  return {
    trainingSet: { data: trainingData, labels: trainingLabels },
    validationSet: { data: validationData, labels: validationLabels },
    testSet: { data: testData, labels: testLabels },
  }
}

function shuffle(arr) {
  let idx = arr.length - 1
  while (idx) {
    const randIdx = Math.floor(Math.random() * idx)
    arr.push(arr.splice(randIdx, 1)[0])
    idx--
  }
}
