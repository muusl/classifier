const { Network } = require("network")
const fs = require("fs")
const { PNG } = require("pngjs")

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

function chunkImage({ width, height, data }) {
  const pixelsPerSecong = 600 / 30
  const secondsPerChunk = 3
  const chunkWidth = pixelsPerSecong * secondsPerChunk
  const chunkCount = Math.floor(width / chunkWidth)

  const chunked = []
  for (let i = 0; i < width - chunkWidth; i += chunkWidth) {
    let chunk = []
    // j=1 to chop off first layer to make image even height :)
    for (let j = 1; j < height; j++) {
      let idx = j * width + i
      chunk = chunk.concat(data.slice(idx, idx + chunkWidth))
    }
    chunked.push(chunk)
  }
  return chunked
}

export default class Classifier {
  constructor(network) {
    if (!network) {
      network = this.constructor.createNetwork()
    }
    this.network = network
  }

  async fromPath(path) {
    const image = await loadImage(path)
    return this.classify(image)
  }

  softmax(arr) {
    const exps = arr.map(x => Math.exp(x))
    const summedExps = exps.reduce((a = 0, b = 0) => a + b)
    const softmaxed = exps.map(x => Math.round(1000 * x / summedExps) / 1000)
    return softmaxed
  }

  vote(arr) {
    const summed = arr.reduce((acc, x) => acc.map((y, i) => x[i] + y))
    return this.softmax(summed)
  }

  classify(image) {
    console.log(image)
    const chunked = chunkImage(image)
    const array = this.network.classify(chunked)
    const final = this.vote(array)
    return { array, final }
  }

  train(data, labels, options) {
    return new Promise((resolve, reject) => {
      this.network.train(data, labels, options)
      resolve()
    })
  }

  toJSON() {
    return this.network.toJSON()
  }

  static fromJSON(json) {
    const network = Network.fromJSON(json)
    return new Classifier(network)
  }

  static createNetwork() {
    const network = new Network()
    const layer = network.addLayer("convolutional", {
      inW: 60,
      inH: 128,
      inD: 1,
      filterW: 20, // 1 second filter
      filterH: 1,
      zeroPaddingX: 10,
      zeroPaddingY: 0,
      strideX: 4, // fifth second checks
      strideY: 1,
      filters: 8,
    })
    network.addLayer("relu")
    const layer2 = network.addLayer("convolutional", {
      inW: 16,
      inH: 128,
      inD: 8,
      filterW: 2,
      filterH: 8,
      strideX: 1,
      strideY: 4,
      zeroPaddingX: 1,
      zeroPaddingY: 2,
      filters: 8,
    })
    network.addLayer("relu")
    const layer3 = network.addLayer("convolutional", {
      inW: 17,
      inH: 32,
      inD: 8,
      filterW: 3,
      filterH: 6,
      zeroPaddingX: 1,
      zeroPaddingY: 1,
      strideX: 2,
      strideY: 4,
      filters: 4,
      // outW: 8,
      // outH: 8,
      // outD: 4,
    })
    network.addLayer("sigmoid")
    network.addLayer("linear", [288, 10])
    network.addLayer("softmax")
    return network
  }
}
