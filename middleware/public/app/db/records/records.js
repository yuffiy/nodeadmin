/* jshint strict: false */
(function () {
  'use strict';
  angular
    .module('nodeadmin.records', [])
    .controller('RecordsController', RecordsController);

  function RecordsController($scope, RecordsFactory, PaginationFactory, ForeignFactory, SortingFactory, TypeCheckFactory, PrimaryKeyFactory, $state, $stateParams) {

    $scope.records = {};
    $scope.headers = [];
    $scope.row = {};
    $scope.foreignValues = ForeignFactory.getForeignValuesArray();
    $scope.enums = TypeCheckFactory.getEnums();


    $scope.$watch(function() {
      return ForeignFactory.enums;
    }, function(newVal, oldVal) {
      if (newVal) {
        console.log('THERE IS A NEW VALUE', newVal);
        $scope.$digest();
      }
    });
    $scope.rowing = false;
    $scope.loading = true;
    $scope.success = false;
    $scope.isEditing = false;

    $scope.table = $stateParams.table;
    $scope.maxSize = PaginationFactory.maxSize;
    $scope.currentPage = PaginationFactory.currentPage;
    $scope.recordsCount = PaginationFactory.records;

    $scope.init = function () {
      SortingFactory.currentTableReset($stateParams.table);
      RecordsFactory.getRecords($stateParams.database, $stateParams.table, $stateParams.page, SortingFactory.getSortBy(), SortingFactory.getSortDir())
        .then(getRecordsComplete)
        .then(getForeignValues)
        .catch(getRecordsFailed)
        .finally(loadingComplete);

      function getRecordsComplete(result) {
        $scope.records = result[0];
        $scope.headers = result[1];
        PaginationFactory.records = result[2][0]['count(*)'] - 100;
        PaginationFactory.currentPage = $stateParams.page;
        PrimaryKeyFactory.getPrimaryKey($scope.headers);
        $scope.recordsCount = PaginationFactory.records;
        $scope.currentPage = PaginationFactory.currentPage;
        return result;
      }

      function getForeignValues(result) {
        console.log(result);
        ForeignFactory.setupForeignValues(result[3]);
        $scope.foreignValues = ForeignFactory.getForeignValuesArray();
        console.log($scope.foreignValues);
      }

      function getRecordsFailed(err) {
        console.error(err);
      }

      function loadingComplete() {

        $scope.loading = false;
      }
    };

    $scope.$watch('ForeignFactory.getForeignValuesArray()', function (newVal, oldVal, scope) {
      if (newVal) {
        $scope.foreignValues = newVal;
        $scope.$digest();
      }
    });
    $scope.pagination = function () {
      $state.go('records', {
        database: $stateParams.database,
        table: $stateParams.table,
        page: $scope.currentPage,
        sortBy: $stateParams.sortBy,
        sortDir: $stateParams.sortDir
      });
    };

    $scope.toggleSort = function (column) {
      console.log(column);
      SortingFactory.toggleSort(column);
      console.log(SortingFactory.sortBy, SortingFactory.sortDir);
      $state.go('records', {
        database: $stateParams.database,
        table: $stateParams.table,
        sortBy: SortingFactory.getSortBy(),
        sortDir: SortingFactory.getSortDir()
      }, {
        location: true
      });
      $scope.init();
    };

    $scope.toggleForm = function () {
      $scope.rowing = $scope.rowing ? false : true;
    };

    $scope.addRow = function () {
      $scope.records.push($scope.row);
      RecordsFactory.addRecord($stateParams.database, $stateParams.table, $stateParams.page, $scope.row)
        .then(addRecordComplete)
        .catch(addRecordFailed)
        .finally($scope.rowing = false);

      function addRecordComplete(response) {
        //TODO: SEND REPONSE TO CLIENT
        console.log(response);
      }

      function addRecordFailed(err) {
        console.error(err);
      }
    };

    $scope.editRow = function (id) {
      $scope.isEditing = id;
    };

    $scope.cancel = function () {
      $scope.isEditing = false;
    };

    $scope.updateRow = function (data) {
      var update = {
        table: $stateParams.table,
        cols: $scope.headers,
        val: data,
        pk: PrimaryKeyFactory.retrievePrimaryKey()
      };

      console.log(update);

      RecordsFactory.editRecord($stateParams.database, $stateParams.table, $stateParams.page, update)
        .then(editRecordComplete)
        .catch(editRecordFailed)
        .finally(setEditToFalse)

      function editRecordComplete(response) {
        //Display some success message to user
        $scope.success = true;
      }

      function editRecordFailed(err) {
        //display some failure message to user
        console.error(err);
      }

      function setEditToFalse() {
        $scope.isEditing = false;
      }
    };

    $scope.isRef = function (column) {
      return ForeignFactory.isRef(column);
    };

    $scope.isNum = function (column) {
      return TypeCheckFactory.isNum(column);
    };

    $scope.isEnum = function (column) {
      var bool = TypeCheckFactory.isEnum(column);
      $scope.enums = TypeCheckFactory.getEnums();
      return bool;
    };


    $scope.isAuto = function (column) {
      return TypeCheckFactory.isAuto(column);
    };

    $scope.notNull = function (column) {
      return TypeCheckFactory.notNull(column);
    };


    $scope.init();
  }
})();