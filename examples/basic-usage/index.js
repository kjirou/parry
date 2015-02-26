var Field = require('../../index').Field;
var Form = require('../../index').Form;


// Define fields
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
var AgeField = Field.extend({ passIfEmpty: true })
  .type('isPositiveInt')
  .type('isGTE', 13)
;


// Define form
var UserForm = Form.extend()
  .field('username', UsernameField)
  .field('password', PasswordField)
  .field('gender', GenderField)
  .field('age', AgeField)
;


// Validate inputs
var inputs = {
  username: 'my-username',
  password: 'abcd1234',
  gender: '',
  age: '30'
};
var userForm = new UserForm(inputs);
userForm.validate(function(err, validationResult) {
  console.log(validationResult);
});
