function ConstantVerse(spec) {
  const {
    self,
    parse,
  } = Verse(spec)

  function render() {
    return parse(`
      <div class='verse constant'>
        <div></div>
      </div>
    `)
  }

  return self.extend({
    render,
  })
}