<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@microsoft/teamsfx-api](./teamsfx-api.md) &gt; [FuncValidation](./teamsfx-api.funcvalidation.md)

## FuncValidation interface

The validation is checked by a validFunc provided by user

<b>Signature:</b>

```typescript
export interface FuncValidation<T extends string | string[] | undefined> 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [validFunc](./teamsfx-api.funcvalidation.validfunc.md) | (input: T, previousInputs?: [Inputs](./teamsfx-api.inputs.md)<!-- -->) =&gt; string \| undefined \| Promise&lt;string \| undefined&gt; | A function that will be called to validate input and to give a hint to the user. |

