'use strict';

describe('Directive and Factory: serverError and serverErrorPopulate', function () {

  var serverErrorParseMock;

  // load the directive's module
  beforeEach(module('zvmzio.server.error', function ($provide) {

    // stub out serverErrorParse so it doesn't affect tests
    serverErrorParseMock = function (errors) { return errors; };
    $provide.value('serverErrorParse', serverErrorParseMock);
  }));

  var serverErrorPopulate,
    element,
    scope;

  beforeEach(inject(function ($rootScope, _serverErrorPopulate_) {
    serverErrorPopulate = _serverErrorPopulate_;
    scope = $rootScope.$new();
  }));

  var testForm =
    '<form name="myform">' +
      '<label for="myid">type me</label><input id="myid" name="myinput" ng-model="mymodel" server-error>' +
      '<label for="otherid">not me</label><input id="otherid" name="otherinput" ng-model="othermodel">' +
    '</form>';

  it('should not change the visible form', inject(function ($compile) {
    element = angular.element(testForm);
    element = $compile(element)(scope);
    expect(element.text()).toBe('type menot me');
    expect(!!scope.myform).toBe(true);
  }));

  it('serverError should default the key to the element name', inject(function ($compile) {
    element = angular.element('<form name="myform"><input name="myinput" ng-model="mymodel" server-error></form>');
    element = $compile(element)(scope);
    expect(scope.myform.myinput.$serverErrorKey).toEqual('myinput');
  }));

  it('serverError should optionally override the key name', inject(function ($compile) {
    element = angular.element('<form name="myform"><input name="myinput" ng-model="mymodel" server-error="serverkey"></form>');
    element = $compile(element)(scope);
    expect(scope.myform.myinput.$serverErrorKey).toEqual('serverkey');
  }));

  it('serverErrorPopulate should return array of strings for unrecognized input elements', inject(function ($compile) {
    element = angular.element(testForm);
    element = $compile(element)(scope);
    expect(serverErrorPopulate(scope.myform, { myinput: 'server error', notmyinput: 'another error' }))
      .toEqual(['another error']);
    expect(scope.myform.$serverError).toEqual(['another error']);
  }));

  it('serverErrorPopulate should not recognized input elements without the directive', inject(function ($compile) {
    element = angular.element(testForm);
    element = $compile(element)(scope);
    expect(serverErrorPopulate(scope.myform, { myinput: 'server error', otherinput: 'other error' }))
      .toEqual(['other error']);
  }));

  it('serverErrorPopulate attach errors to the form', inject(function ($compile) {
    element = angular.element(testForm);
    element = $compile(element)(scope);
    serverErrorPopulate(scope.myform, { myinput: 'server error' });
    expect(scope.myform.$valid).toBeFalsy();
    expect(scope.myform.myinput.$valid).toBeFalsy();
    expect(scope.myform.myinput.$error.serverError).toBeTruthy();
    expect(scope.myform.myinput.$serverError).toEqual('server error');
    expect(scope.myform.$serverError).toEqual(false);
  }));

  it('serverError should clear the error when the input is touched', inject(function ($compile) {
    element = angular.element(testForm);
    element = $compile(element)(scope);
    serverErrorPopulate(scope.myform, { myinput: 'server error' });
    scope.$digest(); // first digest prepares debounce
    expect(scope.myform.$valid).toBeFalsy();
    expect(scope.myform.myinput.$valid).toBeFalsy();
    scope.myform.myinput.$setTouched();
    scope.myform.myinput.$setViewValue('new'); // $setTouched() isn't enough as it gets debounced and ignored
    scope.$digest();
    expect(scope.myform.$valid).toBeTruthy();
    expect(scope.myform.myinput.$valid).toBeTruthy();
  }));
});

describe('Factory: serverErrorParse', function () {

  // load the directive's module
  beforeEach(module('zvmzio.server.error'));

  // instantiate service
  var serverErrorParse;
  beforeEach(inject(function (_serverErrorParse_) {
    serverErrorParse = _serverErrorParse_;
  }));

  it('should return a valid non empty error map when passed a falsey value', function () {
    expect(serverErrorParse(null)).toEqual({ other: 'an undefined error occurred' });
    expect(serverErrorParse('')).toEqual({ other: 'an undefined error occurred' });
  });

  it('should return a valid empty error map unchanged', function () { // TODO: maybe this should return 'an undefined error occurred'
    var valid = {};
    expect(serverErrorParse(valid)).toBe(valid);
  });

  it('should return a valid non empty error map unchanged', function () {
    var valid = {
      key1: 'string1',
      key2: 'string2'
    };
    expect(serverErrorParse(valid)).toBe(valid);
  });

  it('should return an error map with non-string keys compressed into strings', function () {
    var invalid = {
      key1: { complexKey1: 'string1', complexKey2: 'string2' }
    };
    expect(serverErrorParse(invalid)).toEqual({ key1: '{"complexKey1":"string1","complexKey2":"string2"}' });
  });

  it('should return an error map with mongoose error messages extracted', function () {
    var invalid = {
      key1: { path: 'key1', message: 'string2' }
    };
    expect(serverErrorParse(invalid)).toEqual({ key1: 'string2' });
  });
});
