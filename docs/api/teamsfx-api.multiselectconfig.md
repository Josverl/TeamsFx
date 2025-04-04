<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@microsoft/teamsfx-api](./teamsfx-api.md) &gt; [MultiSelectConfig](./teamsfx-api.multiselectconfig.md)

## MultiSelectConfig interface

multiple selection UI config

<b>Signature:</b>

```typescript
export interface MultiSelectConfig extends UIConfig<string[]> 
```
<b>Extends:</b> [UIConfig](./teamsfx-api.uiconfig.md)<!-- -->&lt;string\[\]&gt;

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [onDidChangeSelection?](./teamsfx-api.multiselectconfig.ondidchangeselection.md) | (currentSelectedIds: Set&lt;string&gt;, previousSelectedIds: Set&lt;string&gt;) =&gt; Promise&lt;Set&lt;string&gt;&gt; | <i>(Optional)</i> a callback function which is triggered when the selected values change, which can change the final selected values. |
|  [options](./teamsfx-api.multiselectconfig.options.md) | [StaticOptions](./teamsfx-api.staticoptions.md) | option array |
|  [returnObject?](./teamsfx-api.multiselectconfig.returnobject.md) | boolean | <i>(Optional)</i> This config only works for option items with <code>OptionItem[]</code> type. If <code>returnObject</code> is true, the answer value is an array of <code>OptionItem</code> objects; otherwise, the answer value is an array of <code>id</code> strings. In case of option items with <code>string[]</code> type, whether <code>returnObject</code> is true or false, the returned answer value is always a string array. |

