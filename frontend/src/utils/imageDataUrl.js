export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read image file.'))
    reader.readAsDataURL(file)
  })
}

export function getEntityImage(entity, fallback = '') {
  const raw = entity?.image_data || entity?.image_url || entity?.avatar_url || entity?.avatar || ''
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback
}
