function Verse(spec) {
  const {
    self,
    scroll,
  } = Dom(spec, 'Verse')

  let expression = ''
  const node = scroll.node.appendChild('div')

  node.setAttribute('class', 'verse')

  scroll.node.
  
  function destroy() {

  }

  function render() {
    return `
      <div class='verse'>
        
      </div>
    `
  }
  
  return {
    node,
    destroy,

    get expression() {return expression},
  }
}