function Assets(spec) {
  const {
    paths,
    callbacks,
  } = spec
  
  const self = _.cloneDeep(paths)
  
  let loadTotal = 0
  let loadCount = 0
  let loaded = false
  
  const imageExtensions = ['svg', 'png', 'jpg', 'jpeg']
  const soundExtensions = ['m4a', 'mp3', 'ogg', 'wav']
  
  load(self)
  
  if (callbacks.progress)
    callbacks.progress(0, loadTotal)
  
  function loadAsset(object, folders, file, key) {
    console.log(`Loading asset '${file}' from folders `, folders)
    
    const extensions = _.tail(file.split('.'))
    const extension = extensions[0]
    const name = file.split('.')[0] || key
    const path = 'Assets/'+folders.map(v => v.charAt(0).toUpperCase()+v.slice(1)).join('/')+'/'+name+'.'+extension
    
    const isImage = _.includes(imageExtensions, extension)
    const isSound = _.includes(soundExtensions, extension)
    
    let asset
    
    if (isImage) {
      asset = new Image()
      asset.src = path
      asset.onload = () => assetLoaded(path)
      console.log(`Loading image from ${path}`)
    }
    else if (isSound) {
      asset = new Howl({
        src: path,
        onload: () => assetLoaded(path),
      })
      console.log(`Loading sound from ${path}`)
    }
    else {
      console.log(`Sorry, I don't recognize that extension: ${extension}`)
      return
    }
    
    object[key] = asset
    
    loadCount++
    loadTotal++
  }
  
  function load(object, folders=[]) {
    console.log(`Loading objects in folders:`, folders)
    _.each(object, (v, i) => {
      if (_.isObject(v))
        load(v, [...folders, i])
      else if (_.isString(v))
        loadAsset(object, folders, v, i)
    })
  }
  
  function assetLoaded(path) {
    loadCount--
    
    console.log(`Asset loaded from ${path}, ${loadCount} remain`)
    
    if (loadCount == 0) {
      console.log(`All assets loaded:`, self)
      callbacks.complete()
    }
    else if (callbacks.progress) {
      callbacks.progress(loadTotal-loadCount, loadTotal)
    }
  }
  
  return _.mixIn(self, {
    
    
    get loaded() {return loaded},
  })
}