console.log('boom');

const searchButton = document.getElementById('searchButton')
const searchInput = document.getElementById('searchInput')

searchButton.addEventListener('click', (ev)=>{
    ev.preventDefault()
    window.location = `/books/search/${searchInput.value}`
})