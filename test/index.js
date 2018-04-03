const path = require("path")
import Classifier from "classifier"

// const classifier = Classifier.fromJSON(json)
const classifier = new Classifier()
// console.log(classifier.toJSON())
classifier
  .fromPath(path.resolve(__dirname, "./testSpectogram.png"))
  .then(console.log)
// // classification.final
// // classification.array

// classifier.train(data, labels)
// classifier.toJSON()

// console.assert(classification, 'error')
// classifyFromPath(path.resolve('./testSpectogram.png'))
