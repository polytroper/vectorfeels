function Layer(spec) {
  const {
    camera,
    screen,
  } = spec

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const strokeWidth = 1
  const strokeColor = Color()

  function resize() {
    layer.width = screen.width
    layer.height = screen.height
  }

  function line(start, end, width, color) {

  }

  function circle()

  return {
    resize,
  }
}