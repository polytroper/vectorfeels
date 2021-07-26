function Goal(spec) {
  const {
    self,
    screen,
    camera,
    ctx,
    globalScope,
    log,
    type = 'fixed',
    timer = 0,
    order = null,
    size = 1,
    getCollectors,
    goalCompleted,
    goalFailed,
    getLowestOrder,
  } = Entity(spec, 'Goal')

  const transform = Transform(spec)

  let triggered = false
  let available = false
  let completed = false
  let failed = false

  let triggeringCollector = null
  const triggeringCollectorPosition = Vector2()
  const triggeringCollectorDelta = Vector2()

  const completedFill = Color('#44FF66')
  const triggeredFill = Color('#88CCFF')
  const availableFill = Color('#FFFFFF')
  const unavailableFill = Color('#FFCC22')
  const failedFill = Color('#FF0044')

  const completedStroke = Color('#000000')
  const triggeredStroke = Color('#000000')
  const availableStroke = Color('#000000')
  const unavailableStroke = Color('#000000')
  const failedStroke = Color('#FFFFFF')

  let fillColor = Color()
  let strokeColor = Color()
  let strokeColorB = Color()

  const flashWhite = Color('#FFFFFF')

  let strokeStyle
  let fillStyle

  let strokeWidth = 0.08

  const completedStrokeB = Color(completedStroke).setV(0.4)
  const triggeredStrokeB = Color(triggeredStroke).setV(0.4)
  const availableStrokeB = Color(availableStroke).setV(0.4)
  const unavailableStrokeB = Color(unavailableStroke).setV(0.4)
  const failedStrokeB = Color(failedStroke).setV(0.8)

  const worldPosition = Vector2()
  const cameraDirection = Vector2()
  let cameraDistance = 0

  const collectorPosition = Vector2()

  let flashProgress = 0

  function start() {
    self.reset()
  }

  function tick() {
    if (globalScope.running) {
      self.refreshTriggered()
      self.checkComplete()
    }

    flashProgress *= 0.95

    cameraDirection.set(camera.transform.position)
    transform.invertPoint
    cameraDistance = cameraDirection.magnitude
    if (cameraDistance == 0)
      cameraDirection.set(0, 1)
    else
      cameraDirection.normalize()
  }

  function refreshTriggered() {
    let alreadyTriggered = triggered

    triggered = false
    triggeringCollector = null
    for (collector of getCollectors()) {
      if (intersectCollector(collector)) {
        if (!alreadyTriggered)
          triggeringCollectorPosition.set(collector.transform.position)

        collector.transform.position.subtract(triggeringCollectorPosition, triggeringCollectorDelta)
        triggeringCollectorPosition.set(collector.transform.position)

        triggered = true
        triggeringCollector = collector

        break
      }
    }
  }

  function checkComplete() {
    if (triggered && !completed && !failed) {
      if (available)
        complete()
      else
        fail()
    }
  }

  function complete() {
    if (completed) return

    log(`Goal ${self.name} completed`)

    flashProgress = 1

    completed = true
    goalCompleted(self)
  }

  function fail() {
    if (failed) return

    log(`Goal ${self.name} failed`)

    flashProgress = 1

    failed = true
    goalFailed(self)
  }

  function intersectCollector(collector) {
    collectorPosition.set()
    collector.transform.transformPoint(collectorPosition)
    transform.invertPoint(collectorPosition)

    return collectorPosition.magnitude < collector.size/2
  }

  function drawLocal() {
    if (order) {
      ctx.save()
      ctx.fillStyle = strokeStyle
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '1px Roboto Mono'
      ctx.scale(0.7, -0.7)

      let center = self.shape.center
      ctx.fillText(order, center.x, center.y + 0.25)
      ctx.restore()
    }
  }

  function setAlphaByFlashFade() {
    ctx.globalAlpha = completed ? flashProgress : 1
  }

  function draw() {
    refreshColors()
    camera.drawThrough(ctx, drawLocal, transform)
  }

  function reset() {
    triggered = false
    completed = false
    failed = false

    triggeringCollector = null

    self.refresh()
  }

  function startRunning() {

  }

  function stopRunning() {
    self.reset()
  }

  function refreshColors() {
    strokeColor.set(completed ?
      completedStroke : failed ?
        failedStroke : triggered ?
          triggeredStroke : available ?
            availableStroke : unavailableStroke)

    strokeColorB.set(completed ?
      completedStrokeB : failed ?
        failedStrokeB : triggered ?
          triggeredStrokeB : available ?
            availableStrokeB : unavailableStrokeB)

    availableFill.lerp(completedFill, self.completedProgress, triggeredFill)

    fillColor.set(completed ?
      completedFill : failed ?
        failedFill : triggered ?
          triggeredFill : available ?
            availableFill : unavailableFill)

    strokeColor.lerp(flashWhite, flashProgress)
    strokeColorB.lerp(flashWhite, flashProgress)
    fillColor.lerp(flashWhite, flashProgress)

    strokeStyle = ctx.createLinearGradient(cameraDirection.x * size / 2, -cameraDirection.y * size / 2, -cameraDirection.x * size / 2, cameraDirection.y * size / 2)

    strokeStyle.addColorStop(0, strokeColorB.hex)
    strokeStyle.addColorStop(1 - 1 / (1 + cameraDistance), strokeColor.hex)
    strokeStyle.addColorStop(1, strokeColorB.hex)

    fillStyle = fillColor.hex
  }

  function refresh() {
    available = true

    if (order) {
      available = getLowestOrder().localeCompare(order) >= 0
    }

    self.refreshColors()
  }

  return self.extend({
    transform,

    start,

    tick,
    draw,

    reset,
    refresh,
    refreshColors,

    startRunning,
    stopRunning,

    refreshTriggered,
    checkComplete,

    complete,
    fail,

    setAlphaByFlashFade,

    get completed() { return completed },
    get available() { return available },
    get triggered() { return triggered },
    get failed() { return failed },
    get order() { return order },

    get triggeringCollector() { return triggeringCollector },
    get triggeringCollectorPosition() { return triggeringCollectorPosition },
    get triggeringCollectorDelta() { return triggeringCollectorDelta },

    get fillStyle() { return fillStyle },
    get strokeStyle() { return strokeStyle },
    get strokeWidth() { return strokeWidth },

    get flashProgress() { return flashProgress },
    get flashWhite() { return flashWhite },

    get completedProgress() { return completed ? 1 : 0 },
  })
}