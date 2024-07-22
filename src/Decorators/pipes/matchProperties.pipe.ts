import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MatchProperties(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'matchProperties',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = JSON.parse(JSON.stringify({ ...args.object }));

          if (typeof obj === 'object') {
            return !Object.keys(obj).includes(property)
              ? false
              : value === obj[`${property}`];
          }

          return false;
        },
      },
    });
  };
}
