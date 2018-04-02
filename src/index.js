import { Network, Output } from "network"
import { load, split } from "./data"
import fs from "fs"
async function run() {
  const data = await load(10)
  const { trainingSet, validationSet, testSet } = split(data, [70, 20, 10])
  console.log(trainingSet, validationSet, testSet)

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
  // network.addLayer("relu")
  network.addLayer("sigmoid")
  network.addLayer("linear", [288, 10])
  network.addLayer("softmax")

  // trainingSet.data.forEach(datum => {
  //   if (datum.length !== 7680) throw "asd asd"
  // })

  console.clear()
  let activ = {
    input: trainingSet.data.slice(0, 1),
  }

  // console.log(layer2)

  // console.log({ ...activ })
  // layer.getOutput(activ)
  // console.log({ ...activ })
  // activ.input = activ.output
  // layer2.getOutput(activ)
  // console.log({ ...activ })
  // activ.input = activ.output
  // layer3.getOutput(activ)
  // console.log({ ...activ })
  // debugger
  // throw "asdas"

  // debugger
  network.train(
    trainingSet.data.slice(0, 10),
    trainingSet.labels.slice(0, 10),
    {
      noOfIterations: 5,
      onStep: i => {
        if (i > 0) console.timeEnd(i - 1)
        console.log(i)
        console.time(i)
      },
    }
  )
  const out = network.classify(trainingSet.data.slice(0, 10))
  // const clas = network.classify(trainingSet.data.slice(0, 1))
  console.log(new Output(out, trainingSet.labels.slice(0, 10)).rmse())
  // debugger

  fs.writeFileSync("./networks/1.json", JSON.stringify(network.toJSON()))
}

run()
// const network = new Network()
// network.addLayer()
