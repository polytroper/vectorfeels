function DividerVerse(spec) {
  const {
    self,
    node,
    base,
  } = Verse(spec)
  
  // Quill
  const verse = d3.select(node)
      .classed('divider', true)
  
  const envelope = verse.insert('div', '*:first-child')
      .attr('class', 'bevel')

  function getLatex() {
    return null
  }

  function getExpression() {
    return null
  }

  function serialize() {
    return null
  }
  
  return self.extend({
    getLatex,
    getExpression,
    serialize,

    divider: true,
  })
}