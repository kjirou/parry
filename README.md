# parry [![npm version](https://badge.fury.io/js/parry.svg)](http://badge.fury.io/js/parry)

A loose coupling and structural Node.js validation module.

This module will protect your application from invalid inputs!

![](https://36.media.tumblr.com/fc04bd715990b22b98916ea6b3ec1b5a/tumblr_nk146q9c7i1qzgre3o1_250.jpg)


## Usage
```
var Field = require('parry').Field;
var Form = require('parry').Form;

var UsernameField = Field.extend()
  .type('matches', /[-_a-z0-9]/i)
  .type('isLength', [4, 16])
;
var PasswordField = Field.extend()
  .type('isAlphanumeric')
  .type('isLength', [8, 16])
;
var GenderField = Field.extend({ passIfEmpty: true })
  .type('isIn', ['male', 'female'])
;

var UserForm = Form.extend()
  .field('username', UsernameField)
  .field('password', PasswordField)
  .field('gender', GenderField)
;

// Validate inputs
var inputs = {
  username: 'my-username@',
  password: 'abcd123',
  gender: 'man'
};
var userForm = new UserForm(inputs);
userForm.validate(function(err, validationResult) {
  console.log(validationResult);
  // -> {
  //   isValid: false,
  //   errors: {
  //     username: [ 'Not matched' ],
  //     password: [ 'String is not in range' ],
  //     gender: [ 'Unexpected value' ]
  //   },
  //   reporter: {ErrorReporter}
  // }
});
```
