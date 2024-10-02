document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/Home.html' || window.location.pathname === '/') {
        fetchProducts();
    } else if (window.location.pathname === '/cart.html') {
        fetchCartItems();
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const password = formData.get('password');
            try {
                const response = await fetch('/api/users/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });
    
                if (response.ok) {
                    alert('User registered successfully');
                    window.location.href = '/login.html';
                } else {
                    const data = await response.json();
                    alert(`${data.error}`);
                }
            } catch (err) {
                console.error(err);
                alert('Error: Something went wrong');
            }
        });
    };

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const { token } = await response.json();
                    localStorage.setItem('token', token); // Store token in localStorage for future requests
                    alert('Login successful');
                    window.location.href = '/index.html'; // Redirect to main page after successful login
                } else {
                    const data = await response.json();
                    alert(`${data.error}`);
                }
            } catch (err) {
                console.error(err);
                alert('Login failed. Please try again.');
            }
        });
    }

    // Fetch products function
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
    
            const productList = document.getElementById('product-list');
            productList.innerHTML = '';
    
            products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.className = 'product';
                productDiv.innerHTML = `
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <img src="${product.image}" alt="${product.name}">
                    <p>${product.description}</p>
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
                `;
                productList.appendChild(productDiv);
    
                // Add event listener for each "Add to Cart" button
                const addToCartButton = productDiv.querySelector('.add-to-cart-btn');
                addToCartButton.addEventListener('click', () => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        alert('Please login before adding items to the cart');
                        window.location.href = '/login.html';
                    } else {
                        const productId = addToCartButton.getAttribute('data-product-id');
                        addToCart(productId);
                    }
                });
            });
        } catch (err) {
            console.error(err);
        }
    }
    
    // Call fetchProducts to load the products
    fetchProducts();
    

    // Fetch cart items function
    async function fetchCartItems() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }

            const cart = await response.json();

            const cartItemsContainer = document.getElementById('cart-items');
            cartItemsContainer.innerHTML = '';

            cart.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                
                    <h3>${item.productId.name}</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <img src=${item.productId.image}/>
                    <p>Price: $${(item.quantity * item.productId.price).toFixed(2)}</p>
                    <button class="remove-from-cart-btn" data-cart-item-id="${item._id}">Remove</button>
                `;
                cartItemsContainer.appendChild(itemDiv);

                // Add event listener for each "Remove" button
                const removeFromCartButton = itemDiv.querySelector('.remove-from-cart-btn');
                removeFromCartButton.addEventListener('click', () => {
                    const cartItemId = removeFromCartButton.getAttribute('data-cart-item-id');
                    removeFromCart(cartItemId);
                });
            });
        } catch (err) {
            console.error(err);
        }
    }
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            alert('logout successfully');
            window.location.href = '/login.html';
        });
    }

    // Add to cart function
    async function addToCart(productId) {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            if (response.ok) {
                alert('Product added to cart successfully');
                fetchCartItems(); // Refresh cart items after addition
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to add product to cart');
        }
    }

    // Remove from cart function
    async function removeFromCart(cartItemId) {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/cart/remove/${cartItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Product removed from cart successfully');
                fetchCartItems(); // Refresh cart items after removal
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to remove product from cart');
        }
    }
});
