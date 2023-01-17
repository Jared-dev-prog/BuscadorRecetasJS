

const navegacion = document.querySelectorAll('nav')
const selectCategorias = document.querySelector('#categorias')
const contenedor = document.querySelector('#contenedor')
const main = document.querySelector('main')
const contenedorFavoritos = document.querySelector('.favoritos')

const modal = new bootstrap.Modal('#modal')

const favoritos = document.querySelector('#favoritos')

document.addEventListener('DOMContentLoaded', app)

function app() {
  paginaActual()
  if(selectCategorias){
    obtenerCategorias()
    selectCategorias.addEventListener('change', seleccionarCategoria)
  }

  if(contenedorFavoritos) {
    obtenerFavoritos()
  }

}

function obtenerFavoritos() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
  mostrarCategoria(favoritos)
}

function paginaActual() {
  const actual = window.location.pathname

  if(actual === '/') {
    navegacion[0].firstElementChild.classList.remove('border-b-black')
    navegacion[0].firstElementChild.classList.add('border-b-yellow-400')
  } else if(actual === '/favoritos.html') {
    navegacion[0].lastElementChild.classList.remove('border-b-black')
    navegacion[0].lastElementChild.classList.add('border-b-yellow-400')
  }
}

function obtenerCategorias() {
  const url = 'https://www.themealdb.com/api/json/v1/1/categories.php'
  
  fetch(url)
    .then(respuesta => respuesta.json())
    .then(datos => llenarCategorias(datos.categories))
}

function llenarCategorias(categorias = []) {
  categorias.forEach(categoria => {
    const {strCategory} = categoria
    const option = document.createElement('option')
    option.value = strCategory
    option.textContent = strCategory
    
    selectCategorias.appendChild(option)
  })
}

function seleccionarCategoria(e) {
  const categoria = e.target.value
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`

  fetch(url)
    .then(respuesta => respuesta.json())
    .then(datos => mostrarCategoria(datos.meals))
}

function mostrarCategoria(recetas = []) {
  limpiarHTML(contenedor)

  const heading = document.createElement('h2') 
  heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados'
  heading.className = 'text-center text-3xl font-black mt-5 mb-0'
  contenedor.appendChild(heading)

  const contenedorRecetas = document.createElement('div')
  contenedorRecetas.className = "w-4/5 mx-auto grid gap-4 mt-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2"

  recetas.forEach(receta => {
    const { strMealThumb, strMeal, idMeal } = receta
    const card = document.createElement('div')
    card.className = 'border-2 rounded border-stone-700 shadow'

    const Img = document.createElement('img')
    Img.src = strMealThumb ?? receta.imagen
    const informacion = document.createElement('div')
    informacion.className = 'py-3 px-3'
    const titulo = document.createElement('h3')
    titulo.textContent = strMeal ?? receta.titulo
    titulo.className = 'font-bold text-xl'

    const button = document.createElement('button')
    button.textContent = 'Ver receta'
    button.className = 'bg-black py-1 px-4 text-sm rounded text-white font-semibold mt-4 hover:scale-110 active:scale-90'
    // button.dataset.bsTarget = '#exampleModal'
    // button.dataset.bsToggle = 'modal'

    button.onclick = () => {
      informacionReceta(idMeal ?? receta.id)
    }

    informacion.appendChild(titulo)
    informacion.appendChild(button)
    card.appendChild(Img)
    card.appendChild(informacion)
    contenedorRecetas.appendChild(card)
    contenedor.appendChild(contenedorRecetas)
  })
}

function limpiarHTML(selector) {
  while(selector.firstChild) {
    selector.removeChild(selector.firstChild)
  }
}

function informacionReceta(id) {
  const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`
  fetch(url)
    .then(respuesta => respuesta.json())
    .then(datos => mostrarRecetaModal(datos.meals[0]))
}

function mostrarRecetaModal(receta = {}) {
  const { idMeal, strInstructions, strMeal, strMealThumb } = receta
  const title = document.querySelector('#modal-title')
  title.textContent = strMeal

  const body = document.querySelector('.modal .modal-body')
  body.innerHTML = `
    <img src=${strMealThumb} class='img-fluid' alt='receta ${strMeal}'/>
    <h3 class='mt-3 text-2xl'>Instrucciones</h3>
    <p class='mt-3'>${strInstructions}</p>
    <h3 class='mt-3 text-2xl mb-3'>Ingredientes y cantidades</h3>
  `
  const listGroup = document.createElement('ul')
  listGroup.classList.add('list-group')

  for(let i = 1; i <= 20; i++) {
    if(receta[`strIngredient${i}`]) {
      const ingrediente = receta[`strIngredient${i}`]
      const cantidad = receta[`strMeasure${i}`]

      const ingrendienteLi = document.createElement('li')
      ingrendienteLi.textContent = `${ingrediente}: ${cantidad}`
      ingrendienteLi.classList.add('list-group-item')
      
      listGroup.appendChild(ingrendienteLi)
    }
  }
  body.appendChild(listGroup)

  const modalFooter = document.querySelector('.modal .modal-footer')
  limpiarHTML(modalFooter)

  const botonFavorito = document.createElement('button')
  botonFavorito.classList.add('btn', 'btn-dark', 'popoverButton')
  botonFavorito.textContent = existeStorage(idMeal) ? 'Eliminar favorito' : 'Guardar favorito'

  botonFavorito.onclick = () => {
    if(existeStorage(idMeal)) {
      eliminarFavorito(idMeal)
      botonFavorito.textContent = 'Guardar favorito'
      mostrarToast('Eliminado correctamente')
      return
    }

    agregarFavorito({
      id: idMeal, 
      titulo: strMeal, 
      imagen: strMealThumb
    })

    botonFavorito.textContent = 'Eliminar favorito'
    mostrarToast('Agregado correctamente')
  }

  const botonCerrar = document.createElement('button')
  botonCerrar.classList.add('btn', 'btn-secondary')
  botonCerrar.dataset.bsDismiss = 'modal'
  botonCerrar.textContent = 'Cerrar'

  modalFooter.appendChild(botonFavorito)
  modalFooter.appendChild(botonCerrar)

  modal.show()
}

function agregarFavorito(favorito) {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
  localStorage.setItem('favoritos', JSON.stringify([...favoritos, favorito]))
}

function existeStorage(id) {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
  return favoritos.some(favorito => favorito.id === id)
}

function eliminarFavorito(id) {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
  const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id)
  localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos))
}

function mostrarToast(mensaje) {
  const toastDiv = document.querySelector('#toast')
  const toastBody = document.querySelector('.toast-body')

  const toast = new bootstrap.Toast(toastDiv)
  toastBody.textContent = mensaje
  toast.show()
}


