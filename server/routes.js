const moment = require('moment');
const database = require('../database');
const evaluation = require('../evaluator/simulate.js');
const dumbAlgo1 = require('../algorithms/dumbAlgo1.js').a1;
const dumbAlgo2 = require('../algorithms/dumbAlgo1.js').a2;
const PreProcess = require('../mlas/preprocess.js');
const sampleData = require('../mlas/sampleData/aapl6.js').data;
//----------------algorithms------------------
const Neighbors = require('../mlas/MLs/knn.js');
const SupportVector = require('../mlas/MLs/svm.js');
const Forest = require('../mlas/MLs/rf.js');
const Logistic = require('../mlas/MLs/logistic.js');
//--------------------------------------------
let predictions;

module.exports = function(app) {
  var algorithmInstance;

  app.post('/api/data', (req, res) => {
    function dateFormat(dateOriginal) {
      var date = new Date(dateOriginal);
      date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return date;
    }
    if (req.body.algorithm === 'knn') {
      algorithmInstance = new Neighbors(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'rf') {
      algorithmInstance = new Forest(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'logistic') {
      algorithmInstance = new Logistic(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'svm') {
      algorithmInstance = new SupportVector(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    }

    algorithmInstance.preProcess()
      .then(function() {
        algorithmInstance.train();
      })
      .then(function() {
        algorithmInstance.predict();
      })
      .then(function() {
        return evaluation('d', dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker, algorithmInstance.predictions)
      })
      .then((result) => {
        return database.Simulation.create({ //<------ save in database
          userId: req.userId,
          algorithm: req.body.algorithm,
          frequency: result.frequency,
          startDate: result.startDate,
          endDate: result.endDate,
          tickerSymbol: result.tickerSymbol,
          successRate: result.successRate,
          inclusionError: result.inclusionError,
          exclusionError: result.exclusionError,
          avgReturn: result.avgReturn,
          cummuReturn: result.cummuReturn,
          returnStd: result.returnStd,
          sharpeRatio: result.sharpeRatio,
          benchmarkReturnSelf: result.benchmarkReturnSelf,
          benchmarkReturnMarket: result.benchmarkReturnMarket,
          predictedMoves: result.predictedMoves,
          actualMoves: result.actualMoves,
          totalAssetValues: result.totalAssetValues,
          benchmarkAssetValuesSelf: result.benchmarkAssetValuesSelf,
          benchmarkAssetValuesMarket: result.benchmarkAssetValuesMarket,
          returns: result.returns,
          cashPosition: result.cashPosition,
          stockSharesOwned: result.stockSharesOwned
        });
      })
      .then(result => {
        res.send(result);
      });
  });

  app.get('/api/data', (req, res) => { // <-- get all simulations created by this user
    database.Simulation.findAll({
      where: {
        userId: req.query.userId
      }
    })
    .then(function(data) {
      res.send(data);
    });
  });

}
