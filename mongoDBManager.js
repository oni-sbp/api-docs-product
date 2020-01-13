const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
const DBName = 'Generation'

function insertOne (collectionName, element) {
  mongo.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) {
      console.error(err)
    }
    const db = client.db(DBName)
    const collection = db.collection(collectionName)

    collection.insertOne(element, (_err, result) => {
      if (_err) {
        console.log(_err)
      }
    })
  })
}

function updateOne (collectionName, id, values) {
  mongo.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) {
      console.log(err)
    }

    const db = client.db(DBName)
    const collection = db.collection(collectionName)

    var myQuery = { id: id }
    var newValues = { $set: values }
    collection.updateOne(myQuery, newValues, function (err, res) {
      if (err) {
        console.log(err)
      }
      client.close()
    })
  })
}

async function getElementById (collectionName, id) {
  return new Promise(function (resolve, reject) {
    mongo.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
      }

      const db = client.db(DBName)
      const collection = db.collection(collectionName)

      collection.find().toArray((_err, items) => {
        items.forEach(element => {
          if (element.id === id) {
            resolve(element)
          }
        })
        resolve(null)
      })
    })
  })
}

async function getStatistics () {
  return new Promise((resolve, reject) => {
    mongo.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
      }
      const db = client.db('Generation')
      const collection = db.collection('Generation')
      var SuccessCount = 0
      var FailedCount = 0
      var TryCount = 0
      collection.find().toArray((_err, items) => {
        TryCount = items.length
        items.forEach(element => {
          if (element.failedTests === 0 && element.totalTests !== 0) {
            SuccessCount += 1
          }
          if (element.failedTests > 0) {
            FailedCount += 1
          }
        })

        resolve({
          SuccessCount: SuccessCount,
          FailedCount: FailedCount,
          TryCount: TryCount
        })
      })
    })
  })
}

module.exports = {
  insertOne,
  getElementById,
  getStatistics,
  updateOne
}
