'use strict';

/**
 * @ngdoc directive
 * @name bettyPinkApp.directive:serverError
 * @description
 * # serverError directive to clear the 'serverError' flag when the control is touched.
 * Use with serverErrorDistributor.
 *
 * Usage <input name="name" ng-model="model" server-error="key">
 * The key defaults to name if not provided.
 *
 * More complete example:
 *
 * <div ng-controller="MyCtrl">
 *   <form name="form" ng-submit="onSubmit">
 *     <input name="name" ng-model="model" server-error>
 *     <div ng-messages="form.name.$error">
 *       <span ng-message="serverError">{{ form.name.$serverError }}</span>
 *     </div>
 *
 *     <div ng-repeat="e in form.$serverError">{{ e }}</div>
 *   </form>
 * </div>
 *
 * <script>
 *   angular.module('myApp').controller('MyCtrl', function ($scope, $http, serverErrorPopulate) {
 *     this.onSubmit = function onSubmit(form) {
 *       $http.post('/url', form).error(function (response) {
 *         serverErrorPopulate(form, response);
 *       });
 *     };
 *   });
 * <script>
 */
angular.module('bettyPinkApp')
  .directive('serverError', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$serverErrorKey = attrs.serverError || attrs.name; // set an empty string so we can fnd marked up inputs later
        ngModel.$validators.serverError = function(/* modelValue, viewValue */) {
          // note: consider clearing ngModel.$serverError here
          return ngModel.$touched || !ngModel.$error.serverError; // true if serverError was set until control is touched
        };
      }
    };
  })
/**
 * # serverErrorDistributor function to attach server errors to named controls.
 * If an error is found the following are set:
 *   <field>.$error.serverError = true;
 *   <field>.$serverError = <error String>
 *
 * @param form the form containing the controls
 * @param errors the list of errors from the server in the form: {
 *   field: String,
 *   ...
 * }
 * Returns an array of strings for any errors for which a matching field cannot be found and attaches them to the form.
 *
 * Use with serverError directive.
 * Uses serverErrorParse to adjust errors if format is unexpected; note: this mutates the original object.
 */
  .factory('serverErrorPopulate', function (serverErrorParse) {
    return function (form, errors) {
      var errorMap = serverErrorParse(errors);
      var found = {};
      angular.forEach(form, function (value, key) {
        if (typeof value === 'object' &&
          key.lastIndexOf('$', 0) !== 0 &&
          value.$serverErrorKey &&
          value.hasOwnProperty('$setValidity')) {
          if (errorMap[value.$serverErrorKey]) {
            value.$setValidity('serverError', false);
            value.$serverError = errorMap[value.$serverErrorKey];
            found[value.$serverErrorKey] = true;
          }
        }
      });
      var result = [];
      angular.forEach(errorMap, function (value, key) {
        if (!found[key]) {
          result.push(value);
        }
      });
      form.$serverError = (result.length > 0) && result;
      return result;
    };
  })
/**
 * Helper build an errorMap from an arbitrary set of rules representing a server response.
 * Note: this mutates the original object.
 */
  .factory('serverErrorParse', function () {
    return function (errors) {

      // if errors is falsey we know nothing, so assume something is wrong
      if (!errors) {
        return { other: 'an undefined error occurred' };
      }

      // ensure we can parse errors an object
      if (typeof errors !== 'object') {
        errors = { other: errors };
      }

      // ensure each value is a simple string
      angular.forEach(errors, function (value, key) {
        if (typeof value === 'object') { // a parseable error
          if (value.path === key && value.message) { // a mongoose error
            errors[key] = value.message;
          }
        }

        // some other unrecognized error
        if (typeof errors[key] !== 'string') {
          errors[key] = JSON.stringify(value);
        }
      });

      return errors;
    };
  });
