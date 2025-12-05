const app = document.getElementById('movie-grid');
const movieDetails = document.getElementById('movie-details');
const modal = document.getElementById('movie-modal');
const closeModal = document.querySelector('.close');

// Get search elements from HTML
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortDropdown = document.getElementById('sort-select');
const genreDropdown = document.getElementById('genre-select');

// Get discover buttons
const trendingButton = document.getElementById('trending-button');
const popularButton = document.getElementById('popular-button');
const topRatedButton = document.getElementById('top-rated-button');
const upcomingButton = document.getElementById('upcoming-button');

// API configuration
const API_KEY = '9db035d5af8b05a832827cd3a32276b9';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Store current movies for sorting
let currentMovies = [];
let allGenres = [];

// Load genres when page loads
window.addEventListener('load', () => {
    loadGenres();
    loadTrendingMovies();
});

// Endpoint 1: /genre/movie/list - Load all genres in dropdown
const loadGenres = () => {
    const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            allGenres = data.genres;

            data.genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading genres:', error));
};

// Endpoint 2: /discover/movie - Discover movies
const discoverMovies = (category, genreId) => {
    app.innerHTML = '<p class="loading">Loading movies...</p>';

    let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&page=1`;

    if (category === 'popular') {
        url += '&sort_by=popularity.desc';
    } else if (category === 'top_rated') {
        url += '&sort_by=vote_average.desc&vote_count.gte=1000';
    } else if (category === 'upcoming') {
        url += '&sort_by=popularity.desc&primary_release_date.gte=' + new Date().toISOString().split('T')[0];
    }

    if (genreId) {
        url += `&with_genres=${genreId}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            currentMovies = data.results;
            displayMovies(currentMovies);
        })
        .catch(error => {
            app.innerHTML = '';
            const errorMessage = document.createElement('p');
            errorMessage.setAttribute('class', 'error');
            errorMessage.textContent = `Something went wrong: ${error.message}`;
            app.appendChild(errorMessage);
        });
};

// Load trending movies
const loadTrendingMovies = () => {
    app.innerHTML = '<p class="loading">Loading trending movies...</p>';

    const url = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            currentMovies = data.results;
            displayMovies(currentMovies);
        })
        .catch(error => {
            app.innerHTML = '';
            const errorMessage = document.createElement('p');
            errorMessage.setAttribute('class', 'error');
            errorMessage.textContent = `Something went wrong: ${error.message}`;
            app.appendChild(errorMessage);
        });
};

// Endpoint 3: /search/movie - Search functionality
const performSearch = () => {
    const query = searchInput.value.trim();

    if (!query) {
        app.innerHTML = '<p class="error">Please enter a movie title!</p>';
        return;
    }

    app.innerHTML = '<p class="loading">Searching for movies...</p>';

    const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.results || data.results.length === 0) {
                app.innerHTML = '';
                const noResults = document.createElement('p');
                noResults.setAttribute('class', 'loading');
                noResults.textContent = 'No movies found. Try a different search.';
                app.appendChild(noResults);
                return;
            }

            currentMovies = data.results;
            displayMovies(currentMovies);
        })
        .catch(error => {
            app.innerHTML = '';
            const errorMessage = document.createElement('p');
            errorMessage.setAttribute('class', 'error');
            errorMessage.textContent = `Something went wrong: ${error.message}`;
            app.appendChild(errorMessage);
        });
};

// Display movies on the page
const displayMovies = (movies) => {
    app.innerHTML = '';

    if (movies.length === 0) {
        const noResults = document.createElement('p');
        noResults.setAttribute('class', 'loading');
        noResults.textContent = 'No movies found.';
        app.appendChild(noResults);
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.setAttribute('class', 'movie-card');
        card.setAttribute('data-movie-id', movie.id);

        const poster = document.createElement('img');
        const posterUrl = movie.poster_path
            ? `${IMAGE_BASE_URL}${movie.poster_path}`
            : 'https://placehold.co/500x750?text=No+Poster';
        poster.setAttribute('src', posterUrl);
        poster.setAttribute('alt', movie.title);

        const movieInfo = document.createElement('div');
        movieInfo.setAttribute('class', 'movie-info');

        const h3 = document.createElement('h3');
        h3.textContent = movie.title;

        const rating = document.createElement('p');
        rating.textContent = `⭐ ${movie.vote_average.toFixed(1)}`;

        const year = document.createElement('p');
        const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        year.textContent = `Released: ${releaseYear}`;

        const popularity = document.createElement('p');
        popularity.textContent = `Popularity: ${movie.popularity.toFixed(1)}`;

        const genres = document.createElement('p');
        const movieGenres = movie.genre_ids.map(id => {
            const genre = allGenres.find(g => g.id === id);
            return genre ? genre.name : '';
        }).filter(name => name !== '').join(', ');

        app.appendChild(card);
        card.appendChild(poster);
        card.appendChild(movieInfo);
        movieInfo.appendChild(h3);
        movieInfo.appendChild(rating);
        movieInfo.appendChild(year);
        movieInfo.appendChild(popularity);
        genres.textContent = `Genres: ${movieGenres}`;
        movieInfo.appendChild(genres);

        // Add click event to open modal
        card.addEventListener('click', () => {
            loadMovieDetails(movie.id);
        });
        
        app.appendChild(card);
    });
};

// Endpoint 4: /movie/{id} - Get detailed movie information
const loadMovieDetails = (movieId) => {
    movieDetails.innerHTML = '<p class="loading">Loading movie details...</p>';
    modal.style.display = 'block';

    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return response.json();
        })
        .then(movie => displayMovieDetails(movie))
        .catch(error => {
            movieDetails.innerHTML = '';
            const errorMessage = document.createElement('p');
            errorMessage.setAttribute('class', 'error');
            errorMessage.textContent = `Failed to load details: ${error.message}`;
            movieDetails.appendChild(errorMessage);
        });
};

const displayMovieDetails = (movie) => {
    movieDetails.innerHTML = '';

    const detailsContainer = document.createElement('div');
    detailsContainer.setAttribute('class', 'details-container');

    const poster = document.createElement('img');
    const posterUrl = movie.poster_path
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://placehold.co/500x750?text=No+Poster';
    poster.setAttribute('src', posterUrl);
    poster.setAttribute('alt', movie.title);
    poster.setAttribute('class', 'detail-poster');

    const info = document.createElement('div');
    info.setAttribute('class', 'detail-info');

    const title = document.createElement('h2');
    title.textContent = movie.title;

    const tagline = document.createElement('p');
    tagline.setAttribute('class', 'tagline');
    tagline.textContent = movie.tagline || '';

    const rating = document.createElement('p');
    rating.textContent = `⭐ ${movie.vote_average.toFixed(1)} / 10 (${movie.vote_count} votes)`;

    const runtime = document.createElement('p');
    runtime.textContent = `Runtime: ${movie.runtime} minutes`;

    const releaseDate = document.createElement('p');
    releaseDate.textContent = `Release Date: ${movie.release_date}`;

    const budget = document.createElement('p');
    budget.textContent = `Budget: $${movie.budget.toLocaleString()}`;

    const revenue = document.createElement('p');
    revenue.textContent = `Revenue: $${movie.revenue.toLocaleString()}`;

    const genres = document.createElement('p');
    const genreNames = movie.genres.map(g => g.name).join(', ');
    genres.textContent = `Genres: ${genreNames}`;

    const overview = document.createElement('p');
    overview.setAttribute('class', 'overview');
    overview.textContent = movie.overview;

    movieDetails.appendChild(detailsContainer);
    detailsContainer.appendChild(poster);
    detailsContainer.appendChild(info);
    info.appendChild(title);
    info.appendChild(tagline);
    info.appendChild(rating);
    info.appendChild(runtime);
    info.appendChild(releaseDate);
    info.appendChild(budget);
    info.appendChild(revenue);
    info.appendChild(genres);
    info.appendChild(overview);
};

// Sorting function
const sortMovies = (sortBy) => {
    if (currentMovies.length === 0) return;

    let sortedMovies = [...currentMovies];

    if (sortBy === 'popularity') {
        sortedMovies.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === 'rating') {
        sortedMovies.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortBy === 'year') {
        sortedMovies.sort((a, b) => {
            const yearA = a.release_date ? a.release_date.substring(0, 4) : '0';
            const yearB = b.release_date ? b.release_date.substring(0, 4) : '0';
            return yearB - yearA;
        });
    } else if (sortBy === 'title') {
        sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
    }

    displayMovies(sortedMovies);
};

// Event Listeners
searchButton.addEventListener('click', performSearch);

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') performSearch();
});

sortDropdown.addEventListener('change', (event) => {
    // Note: Used event.target.value instead of this.value
    sortMovies(event.target.value);
});

genreDropdown.addEventListener('change', (event) => {
    // Note: Used event.target.value instead of this.value
    const genreId = event.target.value;
    if (genreId) {
        discoverMovies('popular', genreId);
    } else {
        discoverMovies('popular');
    }
});

trendingButton.addEventListener('click', () => loadTrendingMovies());
popularButton.addEventListener('click', () => discoverMovies('popular'));
topRatedButton.addEventListener('click', () => discoverMovies('top_rated'));
upcomingButton.addEventListener('click', () => discoverMovies('upcoming'));

// Close modal
closeModal.addEventListener('click', () => modal.style.display = 'none');

window.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = 'none';
});