// =====================================================
// L’AURA SKINSATION
// Main Website JavaScript
// =====================================================

const API_URL = "http://localhost:3000/api";

let products = [];
let selectedProduct = null;


// =====================================================
// LOAD PRODUCTS FROM DATABASE
// =====================================================

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (!data.success) {
            console.error("Could not load products.");
            return;
        }

        products = data.products || [];

        console.log("Products loaded:", products);

        renderProducts();

    } catch (error) {
        console.error("Error loading products:", error);
    }
}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {
    const productsGrid = document.querySelector(".product-grid");

    if (!productsGrid) {
        console.error("Products grid not found.");
        return;
    }

    productsGrid.innerHTML = "";

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <p class="empty-products">
                No products available at the moment.
            </p>
        `;
        return;
    }

    products.forEach(function (product) {

        const card = document.createElement("article");

        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">

                ${
                    product.image
                    ? `
                        <img
                            src="http://localhost:3000${product.image}"
                            alt="${product.name}"
                        >
                    `
                    : `
                        <div class="product-image-placeholder">
                            <span>L’Aura</span>
                        </div>
                    `
                }

            </div>

            <div class="product-content">

                <h3>${product.name}</h3>

                <p class="product-description">
                    ${product.description}
                </p>

                <div class="product-bottom">

                    <strong>
                        ₦${Number(product.price).toLocaleString()}
                    </strong>

                    <button
                        type="button"
                        class="view-product-btn"
                        data-product-id="${product.id}"
                    >
                        View Product
                    </button>

                </div>

            </div>
        `;

        productsGrid.appendChild(card);
    });
}
// =====================================================
// LOAD REVIEWS FROM DATABASE
// =====================================================

async function loadReviews() {

    try {

        const response =
            await fetch(`${API_URL}/reviews`);

        const data =
            await response.json();

        if (!data.success) {

            console.error(
                "Could not load reviews."
            );

            return;
        }

        console.log(
            "Published reviews loaded:",
            data.reviews
        );
        console.log("FIRST REVIEW:", data.reviews[0]);

        renderReviews(
            data.reviews || []
        );

    } catch (error) {

        console.error(
            "Error loading reviews:",
            error
        );

    }

}

// =====================================================
// RENDER REVIEWS
// =====================================================

function renderReviews(reviews) {

    const reviewsContainer =
        document.getElementById("reviewGrid");

    if (!reviewsContainer) {

        console.error(
            "Review grid not found."
        );

        return;
    }

    reviewsContainer.innerHTML = "";

    if (!reviews || reviews.length === 0) {

        reviewsContainer.innerHTML = `
            <p class="empty-reviews">
                No customer reviews available yet.
            </p>
        `;

        return;
    }

    reviews.forEach(function (review) {

        const reviewCard =
            document.createElement("article");

        reviewCard.className =
            "review-card";

        const rating =
            Number(review.rating) || 0;

        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);


        // BEFORE IMAGE
        const beforeImage =
            review.before_image
                ? `http://localhost:3000${review.before_image}`
                : "";


        // AFTER IMAGE
        const afterImage =
            review.after_image
                ? `http://localhost:3000${review.after_image}`
                : "";


        reviewCard.innerHTML = `

            <div class="review-stars">
                ${stars}
            </div>


            <div class="review-result-images">

                ${
                    beforeImage
                        ? `
                            <div class="review-result-image">
                                <span>Before</span>

                                <img
                                    src="${beforeImage}"
                                    alt="Before result"
                                >
                            </div>
                        `
                        : ""
                }


                ${
                    afterImage
                        ? `
                            <div class="review-result-image">
                                <span>After</span>

                                <img
                                    src="${afterImage}"
                                    alt="After result"
                                >
                            </div>
                        `
                        : ""
                }

            </div>


            <p class="review-text">
                "${review.review}"
            </p>


            <h4 class="review-customer">
                ${review.customer_name}
            </h4>

        `;


        reviewsContainer.appendChild(
            reviewCard
        );

    });

}

// =====================================================
// PRODUCT VIEW BUTTON
// =====================================================

document.addEventListener("click", function (event) {

    const viewButton = event.target.closest(".view-product-btn");

    if (!viewButton) {
        return;
    }

    const productId = Number(
        viewButton.getAttribute("data-product-id")
    );

    console.log("Clicked product ID:", productId);

    if (Number.isNaN(productId)) {

        console.error(
            "Product button has no valid product ID."
        );

        return;
    }

    const product = products.find(function (item) {

        return Number(item.id) === productId;

    });

    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        return;
    }

    selectedProduct = product;
// Product image
const modalProductImage =
    document.getElementById("modalProductImage");

if (modalProductImage) {

    if (product.image) {

        modalProductImage.src =
            `http://localhost:3000${product.image}`;

        modalProductImage.alt =
            product.name;

        modalProductImage.style.display =
            "block";

    } else {

        modalProductImage.style.display =
            "none";

    }
}
    // Product name
    const modalProductName =
        document.getElementById("modalProductName");

    if (modalProductName) {
        modalProductName.textContent = product.name;
    }


    // Product price
    const modalProductPrice =
        document.getElementById("modalProductPrice");

    if (modalProductPrice) {

        modalProductPrice.textContent =
            `₦${Number(product.price).toLocaleString()}`;

    }


    // Product description
    const modalProductDescription =
        document.getElementById("modalProductDescription");

    if (modalProductDescription) {

        modalProductDescription.textContent =
            product.description;

    }


    // Skin type
    const modalSkinType =
        document.getElementById("modalSkinType");

    if (modalSkinType) {

        modalSkinType.textContent =
            product.skin_type;

    }


    // Concern
    const modalConcern =
        document.getElementById("modalConcern");

    if (modalConcern) {

        modalConcern.textContent =
            product.concern;

    }


    // Open modal
    const productModal =
        document.getElementById("productModal");

    if (productModal) {

        productModal.classList.add("open");

    }

});


// =====================================================
// CLOSE PRODUCT MODAL
// =====================================================

const modalClose =
    document.getElementById("modalClose");

if (modalClose) {

    modalClose.addEventListener("click", function () {

        const productModal =
            document.getElementById("productModal");

        if (productModal) {

            productModal.classList.remove("open");

        }

    });

}


// Close modal when clicking outside
const productModal =
    document.getElementById("productModal");

if (productModal) {

    productModal.addEventListener("click", function (event) {

        if (event.target === productModal) {

            productModal.classList.remove("open");

        }

    });

}


// =====================================================
// CART
// =====================================================

let cart = JSON.parse(
    localStorage.getItem("lAuraCart")
) || [];


// =====================================================
// UPDATE CART COUNT
// =====================================================

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    const totalQuantity = cart.reduce(
        function (total, item) {

            return total + Number(item.quantity);

        },
        0
    );

    cartCount.textContent = totalQuantity;

}


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

    localStorage.setItem(
        "lAuraCart",
        JSON.stringify(cart)
    );

    updateCartCount();

    renderCart();

}


// =====================================================
// ADD PRODUCT TO CART
// =====================================================

const addToCartButton =
    document.getElementById("addToCart");

if (addToCartButton) {

    addToCartButton.addEventListener(
        "click",
        function () {

            if (!selectedProduct) {

                console.error(
                    "No product selected."
                );

                return;
            }

            const existingItem =
                cart.find(function (item) {

                    return Number(item.id) ===
                        Number(selectedProduct.id);

                });


            if (existingItem) {

                existingItem.quantity += 1;

            } else {

                cart.push({

                    id: selectedProduct.id,

                    name: selectedProduct.name,

                    price: Number(
                        selectedProduct.price
                    ),

                    quantity: 1

                });

            }


            saveCart();


            // Close modal
            const productModal =
                document.getElementById(
                    "productModal"
                );

            if (productModal) {

                productModal.classList.remove(
                    "open"
                );

            }


            // Open cart
            openCart();

        }
    );

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

    const cartOverlay =
        document.getElementById("cartOverlay");

    if (cartOverlay) {

        cartOverlay.classList.add("open");

    }

    renderCart();

}


// =====================================================
// CLOSE CART
// =====================================================

const cartClose =
    document.getElementById("cartClose");

if (cartClose) {

    cartClose.addEventListener(
        "click",
        function () {

            const cartOverlay =
                document.getElementById(
                    "cartOverlay"
                );

            if (cartOverlay) {

                cartOverlay.classList.remove(
                    "open"
                );

            }

        }
    );

}


// =====================================================
// CART BUTTON
// =====================================================

const cartButton =
    document.getElementById("cartButton");

if (cartButton) {

    cartButton.addEventListener(
        "click",
        function () {

            openCart();

        }
    );

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    if (!cartItems || !cartTotal) {
        return;
    }

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

        cartTotal.textContent = "₦0";

        return;
    }

    let total = 0;

    cart.forEach(function (item, index) {

        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;

        const itemTotal = price * quantity;

        total += itemTotal;

        const cartItem =
            document.createElement("div");

        cartItem.className = "cart-item";

        cartItem.innerHTML = `

            <div class="cart-item-info">

                <h4>
                    ${item.name}
                </h4>

                <p>
                    ₦${price.toLocaleString()}
                </p>

            </div>

            <div class="cart-item-controls">

                <button
                    type="button"
                    class="quantity-minus"
                    data-index="${index}"
                >
                    −
                </button>

                <span>
                    ${quantity}
                </span>

                <button
                    type="button"
                    class="quantity-plus"
                    data-index="${index}"
                >
                    +
                </button>

                <button
                    type="button"
                    class="remove-cart-item"
                    data-index="${index}"
                >
                    Remove
                </button>

            </div>

        `;

        cartItems.appendChild(cartItem);

    });

    cartTotal.textContent =
        `₦${total.toLocaleString()}`;
}


// =====================================================
// CART QUANTITY CONTROLS
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        // Increase quantity
        const plusButton =
            event.target.closest(
                ".quantity-plus"
            );

        if (plusButton) {

            const index =
                Number(
                    plusButton.dataset.index
                );

            if (cart[index]) {

                cart[index].quantity += 1;

                saveCart();

            }

            return;
        }


        // Decrease quantity
        const minusButton =
            event.target.closest(
                ".quantity-minus"
            );

        if (minusButton) {

            const index =
                Number(
                    minusButton.dataset.index
                );

            if (cart[index]) {

                cart[index].quantity -= 1;


                if (cart[index].quantity <= 0) {

                    cart.splice(index, 1);

                }


                saveCart();

            }

            return;
        }


        // Remove item
        const removeButton =
            event.target.closest(
                ".remove-cart-item"
            );

        if (removeButton) {

            const index =
                Number(
                    removeButton.dataset.index
                );

            if (cart[index]) {

                cart.splice(index, 1);

                saveCart();

            }

        }

    }
);


// =====================================================
// CHECKOUT BUTTON
// =====================================================

const checkoutButton =
    document.getElementById("checkoutButton");

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        function () {

            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }

            window.location.href =
                "checkout.html";

        }
    );

}

// =====================================================
// SKIN ASSESSMENT FORM
// =====================================================

const skinAssessmentForm =
    document.getElementById(
        "skinAssessmentForm"
    );


if (skinAssessmentForm) {

    skinAssessmentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const formData =
                new FormData(
                    skinAssessmentForm
                );


            const requestData = {

                mainConcern:
                    formData.get("mainConcern"),

                currentProduct:
                    formData.get("currentProduct"),

                skinType:
                    formData.get("skinType"),

                previousProducts:
                    formData.get("previousProducts"),

                budget:
                    formData.get("budget"),

                irritation:
                    formData.get("irritation"),

                allergies:
                    formData.get("allergies"),

                routine:
                    formData.get("routine"),

                customerName:
                    formData.get("customerName"),

                customerEmail:
                    formData.get("customerEmail"),

                customerPhone:
                    formData.get("customerPhone")

            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/recommendation-requests`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    requestData
                                )

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Could not submit assessment."
                    );

                }


                alert(
                    "Thank you! Your skincare assessment has been submitted successfully. Our team will review your information and get back to you."
                );


                skinAssessmentForm.reset();


                console.log(
                    "Recommendation request submitted:",
                    data.request
                );


            } catch (error) {

                console.error(
                    "SKIN ASSESSMENT ERROR:",
                    error
                );


                alert(
                    "Sorry, we could not submit your assessment. Please try again."
                );

            }

        }
    );

}

// =====================================================
// MOBILE NAVIGATION
// =====================================================

const menuToggle =
    document.getElementById("menuToggle");

const navLinks =
    document.querySelector(".nav-links");


if (menuToggle && navLinks) {

    menuToggle.addEventListener(
        "click",
        function () {

            navLinks.classList.toggle(
                "open"
            );

        }
    );

}


// Close mobile menu when clicking a link
if (navLinks) {

    navLinks.addEventListener(
        "click",
        function (event) {

            if (
                event.target.tagName ===
                "A"
            ) {

                navLinks.classList.remove(
                    "open"
                );

            }

        }
    );

}


// =====================================================
// SMOOTH SCROLL
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                'a[href^="#"]'
            );

        if (!link) {
            return;
        }


        const targetId =
            link.getAttribute("href");


        if (
            !targetId ||
            targetId === "#"
        ) {
            return;
        }


        const target =
            document.querySelector(
                targetId
            );


        if (target) {

            event.preventDefault();


            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    }
);


// =====================================================
// SCROLL ANIMATIONS
// =====================================================

function setupScrollAnimations() {

    const elements =
        document.querySelectorAll(
            ".fade-in"
        );


    if (
        !("IntersectionObserver" in window)
    ) {

        elements.forEach(
            function (element) {

                element.classList.add(
                    "visible"
                );

            }
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.15
            }
        );


    elements.forEach(
        function (element) {

            observer.observe(element);

        }
    );

}


// =====================================================
// FOOTER YEAR
// =====================================================

function updateFooterYear() {

    const yearElement =
        document.getElementById(
            "currentYear"
        );


    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

}


// =====================================================
// INITIALIZE WEBSITE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "L’Aura Skinsation website loaded."
        );


        updateCartCount();

        renderCart();

        updateFooterYear();

        setupScrollAnimations();

        loadProducts();
        loadReviews();

    }
);