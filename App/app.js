// Welcome to main.js, where we set the stage for VectorFeels

const MQ = MathQuill.getInterface(2);
      
function app() {
  const stepping = false
  
  const canvas = $('#canvas')
  
  const engine = Engine({
    stepping,
    
    canvas,
  })
}

console.log('Launching VectorFeels')
app()