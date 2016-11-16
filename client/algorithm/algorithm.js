(function() {
  'use strict'
  
  angular
    .module('einstock.algorithm', [
      'ngMaterial'
    ])

    //this will be the controller to create new campaigns
    .controller('algorithmController', algoCtrl)

  function algoCtrl($scope, Algorithm) {
    $scope.data = {
      ticker: 'GOOG',
      startDate: new Date(),
      endDate: new Date()
    }
    $scope.log = function() {
      Algorithm.show($scope.data);
    }
  }

})();
