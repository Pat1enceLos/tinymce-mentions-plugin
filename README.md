# tinymce-mentions-plugin
tinymce mentions plugin



### usage

```js
// tinymce options
{
  plugins: 'mentions',
  mentionsOption: {
    mentionsList: [{ userId: 1, name: '张三' }, { userId: 2, name: '李四' }],
    mentionsFilterOption(targetText, item) {
      return item.name.includes(targetText);
    }
  }
}
```
