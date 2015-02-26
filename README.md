# parry

[![npm version](https://badge.fury.io/js/parry.svg)](http://badge.fury.io/js/parry)
[![Build Status](https://travis-ci.org/kjirou/parry.svg?branch=master)](https://travis-ci.org/kjirou/parry)

A loose coupling and structural Node.js validation module.

This module will protect your application from invalid inputs!

![](https://36.media.tumblr.com/fc04bd715990b22b98916ea6b3ec1b5a/tumblr_nk146q9c7i1qzgre3o1_250.jpg)


## Installation
```
npm install parry
```

Or, you can use in browser through the [browserify](https://github.com/substack/node-browserify).


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
  //   reporter: { ErrorReporter instance }
  // }
});
```


## Field
### Field.type
You can set the following typical validations.

- [validator.js](https://github.com/chriso/validator.js) validators
- [And own extensions](https://github.com/kjirou/parry/blob/master/lib/validatorjs-extender.js)

Example:
```
var SubField = Field.extend();
  .type('isEmail');
  .type('isLength', [4, 64])
;
```

### Field.specify
Use it, in the case of complex validation.

Example:
```
var SubField = Field.extend()
  .specify(function(input, callback) {
    if (input === 'good') {
      callback(null, { isValid: true });
    } else {
      callback(null, { isValid: false, message: 'It is a not good input' });
    }
    // error handling:
    // callback(new Error('Runtime Error'));
  })
;
```

### Field.passIfEmpty
Pass validation if value is empty.

Default: `false`

Example:
```
var SubField = Field.extend({ passIfEmpty: true });
```

### Field.shouldCheckAll
Check all validators already even if error occurs.

Default: `false`

Example:
```
var SubField = Field.extend({ shouldCheckAll: true });
```

### Field.extend
Create sub class.

Example:
```
var SubField = Field.extend({ passIfEmpty: true, shouldCheckAll: true })
  .type('isEmail')
  .type('isLength', [4, 64])
;
```
