# parry

[![npm version](https://badge.fury.io/js/parry.svg)](http://badge.fury.io/js/parry)
[![Build Status](https://travis-ci.org/kjirou/parry.svg?branch=master)](https://travis-ci.org/kjirou/parry)

A structural Node.js validation module.

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

```
var SubField = Field.extend();
  .type('isEmail');
  .type('isLength', [4, 64])
;
```

### Field.specify
Use it, in the case of complex validation.

```
var SubField = Field.extend()
  .specify(function(input, callback) {
    if (input === 'good') {
      callback(null, { isValid: true });
    } else if (input === 'bad') {
      callback(null, { isValid: false, errorMessages: ['It is a bad input'] });
    } else {
      // Error message is 'It is a not good input'
      callback(null, { isValid: false });
    }
  }, 'It is a not good input')
;
```

### Field.passIfEmpty
Pass validation if value is empty.

Default: `false`

```
var SubField = Field.extend({ passIfEmpty: true });
```

### Field.shouldValidateAll
Validate all validators already even if error occurs.

Default: `false`

```
var SubField = Field.extend({ shouldValidateAll: true });
```

### Field.extend
Create sub class.

```
var SubField = Field.extend({ passIfEmpty: true, shouldValidateAll: true });
```

### Field.prototype.validate
Validate with input.


## Form
### Form.field
Set Field sub class with id.

Please see [Usage](#usage).

### Form.extend
Create sub class.

```
var SubForm = Field.extend({ shouldValidateAll: true });
```

### Form.shouldValidateAll
Validate all fields already even if error occurs

Default: `true`

```
var SubForm = Form.extend({ shouldValidateAll: true });
```

### Form.prototype.input
Input a value.

```
form.input('email', 'foo@example.com');
```

### Form.prototype.inputs
Input values.

```
form.inputs({
  email: 'foo@example.com',
  username: 'foo'
});
```

Or,
```
var form = new SubForm({
  email: 'foo@example.com',
  username: 'foo'
});
```

### Form.prototype.validate
Validate fields with inputs.

Please see [Usage](#usage).


## ErrorReporter


## DEFAULT_ERROR_MESSAGES
