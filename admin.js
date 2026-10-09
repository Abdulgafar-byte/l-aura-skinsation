const API_URL = "https://l-aura-skinsation.onrender.com/api";
// =====================================================
// IMAGE URL HELPER — RENDER + SUPABASE
// =====================================================

function getImageUrl(imagePath) {
    if (!imagePath) {
        return "";
    }

    if (
        imagePath.startsWith("https://") ||
        imagePath.startsWith("http://")
    ) {
        return imagePath;
    }

    return `https://l-aura-skinsation.onrender.com${imagePath}`;
}

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function getElementValue(id) {

    const element = document.getElementById(id);

    if (!element) return "";

    return element.value.trim();
}


function setElementValue(id, value) {

    const element = document.getElementById(id);

    if (!element) return;

    element.value = value || "";
}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   PRODUCTS
===================================================== */

async function loadAdminProducts() {

    const container =
        document.getElementById("adminProducts");

    if (!container) return;

    try {

        const response =
            await fetch(`${API_URL}/products`);

        const data =
            await response.json();

        if (!data.success) {

            container.innerHTML =
                "<p>Unable to load products.</p>";

            return;
        }

        renderAdminProducts(data.products);

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        container.innerHTML = `
            <p>
                Backend is not connected.
                Make sure the L’Aura backend is running.
            </p>
        `;
    }
}


function renderAdminProducts(products) {

    const container =
        document.getElementById("adminProducts");

    if (!container) return;

    container.innerHTML = "";

    if (!products || products.length === 0) {

        container.innerHTML =
            "<p>No products have been added yet.</p>";

        return;
    }

    products.forEach(function (product) {

        const card =
            document.createElement("div");

        card.className =
            "admin-product-item";

        const imageHTML =
            product.image
                ? `
                    <img
                        src="${getImageUrl(product.image)}"
                        alt="${escapeHtml(product.name)}"
                        class="admin-product-image"
                    >
                `
                : `
                    <div class="admin-product-image-placeholder">
                        No Image
                    </div>
                `;

        card.innerHTML = `

            ${imageHTML}

            <div class="admin-product-info">

                <h3>
                    ${escapeHtml(product.name)}
                </h3>

                <p>
                    ₦${Number(
                        product.price
                    ).toLocaleString()}
                </p>

                <small>
                    Stock: ${product.stock}
                </small>

                <small>
                    Skin Type:
                    ${escapeHtml(product.skin_type)}
                </small>

                <small>
                    Concern:
                    ${escapeHtml(product.concern)}
                </small>

            </div>

            <div class="admin-product-actions">

                <button
                    type="button"
                    class="delete-product"
                    data-id="${product.id}"
                >
                    Delete
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}


/* =====================================================
   ADD PRODUCT
===================================================== */

function initializeProductForm() {

    const productForm =
        document.getElementById("productForm");

    if (!productForm) return;

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const message =
                document.getElementById(
                    "productMessage"
                );

            const name =
                getElementValue("productName");

            const price =
                Number(
                    document.getElementById(
                        "productPrice"
                    )?.value || 0
                );

            const stock =
                Number(
                    document.getElementById(
                        "productStock"
                    )?.value || 0
                );

            const skinType =
                getElementValue("productSkinType");

            const concern =
                getElementValue("productConcern");

            const description =
                getElementValue("productDescription");

            const imageInput =
                document.getElementById("productImage");

            const imageFile =
                imageInput?.files?.[0];


            if (!name) {

                if (message) {
                    message.textContent =
                        "Please enter the product name.";
                }

                return;
            }


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                if (message) {
                    message.textContent =
                        "Please enter a valid price.";
                }

                return;
            }


            if (
                !Number.isFinite(stock) ||
                stock < 0
            ) {

                if (message) {
                    message.textContent =
                        "Please enter a valid stock quantity.";
                }

                return;
            }


            if (!skinType) {

                if (message) {
                    message.textContent =
                        "Please enter the skin type.";
                }

                return;
            }


            if (!concern) {

                if (message) {
                    message.textContent =
                        "Please enter the skin concern.";
                }

                return;
            }


            if (!description) {

                if (message) {
                    message.textContent =
                        "Please enter the product description.";
                }

                return;
            }


            if (
                imageFile &&
                imageFile.size >
                5 * 1024 * 1024
            ) {

                if (message) {
                    message.textContent =
                        "Image is too large. Maximum size is 5MB.";
                }

                return;
            }


            try {

                if (message) {
                    message.textContent =
                        "Adding product...";
                }


                const formData =
                    new FormData();


                formData.append(
                    "name",
                    name
                );

                formData.append(
                    "price",
                    price
                );

                formData.append(
                    "description",
                    description
                );

                formData.append(
                    "skinType",
                    skinType
                );

                formData.append(
                    "concern",
                    concern
                );

                formData.append(
                    "stock",
                    stock
                );


                if (imageFile) {

                    formData.append(
                        "image",
                        imageFile
                    );
                }


                const response =
                    await fetch(
                        `${API_URL}/products`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not add product."
                    );
                }


                if (message) {
                    message.textContent =
                        "Product added successfully!";
                }


                productForm.reset();

                await loadAdminProducts();


            } catch (error) {

                console.error(
                    "Add product error:",
                    error
                );

                if (message) {
                    message.textContent =
                        error.message ||
                        "Something went wrong.";
                }
            }
        }
    );
}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function handleDeleteProduct(productId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `${API_URL}/products/${productId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not delete product."
            );
        }


        await loadAdminProducts();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            error.message ||
            "Could not delete product."
        );
    }
}


/* =====================================================
   REVIEWS
===================================================== */

async function loadAdminReviews() {

    const container =
        document.getElementById("adminReviews");

    if (!container) return;

    try {

        const response =
            await fetch(
                `${API_URL}/admin/reviews`
            );


        const data =
            await response.json();


        if (!data.success) {

            container.innerHTML =
                "<p>Unable to load reviews.</p>";

            return;
        }


        renderAdminReviews(
            data.reviews
        );


    } catch (error) {

        console.error(
            "Load reviews error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load reviews.</p>";
    }
}


function renderAdminReviews(reviews) {

    const container =
        document.getElementById("adminReviews");

    if (!container) return;

    container.innerHTML = "";

    if (
        !reviews ||
        reviews.length === 0
    ) {

        container.innerHTML =
            "<p>No reviews have been added yet.</p>";

        return;
    }


    reviews.forEach(function (review) {

        const card =
            document.createElement("div");

        card.className =
            "admin-product-item";


        const stars =
            "★".repeat(
                Number(review.rating) || 0
            );


        const beforeImage =
            review.before_image
                ? `
                    <img
                        src="${getImageUrl(review.before_image)}"
                        alt="Before"
                        class="admin-review-image"
                    >
                `
                : "";


        const afterImage =
            review.after_image
                ? `
                    <img
                        src="${getImageUrl(review.after_image)}"
                        alt="After"
                        class="admin-review-image"
                    >
                `
                : "";


        card.innerHTML = `

            <div class="admin-product-info">

                <h3>
                    ${escapeHtml(
                        review.customer_name
                    )}
                </h3>

                <p>
                    ${stars}
                </p>

                <p>
                    ${escapeHtml(
                        review.review
                    )}
                </p>

                <div class="admin-review-images">

                    ${beforeImage}

                    ${afterImage}

                </div>

                <small>
                    Status:
                    ${
                        review.published === 1
                            ? "Published"
                            : "Hidden"
                    }
                </small>

            </div>


            <div class="admin-product-actions">

                <button
                    type="button"
                    class="toggle-review"
                    data-id="${review.id}"
                >
                    ${
                        review.published === 1
                            ? "Hide"
                            : "Publish"
                    }
                </button>


                <button
                    type="button"
                    class="delete-review"
                    data-id="${review.id}"
                >
                    Delete
                </button>

            </div>
        `;


        container.appendChild(card);
    });
}


/* =====================================================
   ADD REVIEW
===================================================== */

function initializeReviewForm() {

    const reviewForm =
        document.getElementById("reviewForm");

    if (!reviewForm) return;


    reviewForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "reviewMessage"
                );


            const customerName =
                getElementValue(
                    "reviewCustomerName"
                );


            const rating =
                document.getElementById(
                    "reviewRating"
                )?.value || "";


            const review =
                getElementValue(
                    "reviewText"
                );


            const beforeInput =
                document.getElementById(
                    "reviewBeforeImage"
                );


            const afterInput =
                document.getElementById(
                    "reviewAfterImage"
                );


            const beforeFile =
                beforeInput?.files?.[0];


            const afterFile =
                afterInput?.files?.[0];


            if (!customerName) {

                if (message) {
                    message.textContent =
                        "Please enter the customer name.";
                }

                return;
            }


            if (!rating) {

                if (message) {
                    message.textContent =
                        "Please select a rating.";
                }

                return;
            }


            if (!review) {

                if (message) {
                    message.textContent =
                        "Please enter the review.";
                }

                return;
            }


            if (
                beforeFile &&
                beforeFile.size >
                5 * 1024 * 1024
            ) {

                if (message) {
                    message.textContent =
                        "Before image is too large.";
                }

                return;
            }


            if (
                afterFile &&
                afterFile.size >
                5 * 1024 * 1024
            ) {

                if (message) {
                    message.textContent =
                        "After image is too large.";
                }

                return;
            }


            try {

                if (message) {
                    message.textContent =
                        "Adding review...";
                }


                const formData =
                    new FormData();


                formData.append(
                    "customerName",
                    customerName
                );


                formData.append(
                    "rating",
                    rating
                );


                formData.append(
                    "review",
                    review
                );


                if (beforeFile) {

                    formData.append(
                        "beforeImage",
                        beforeFile
                    );
                }


                if (afterFile) {

                    formData.append(
                        "afterImage",
                        afterFile
                    );
                }


                const response =
                    await fetch(
                        `${API_URL}/reviews`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not add review."
                    );
                }


                if (message) {
                    message.textContent =
                        "Review added successfully!";
                }


                reviewForm.reset();

                await loadAdminReviews();


            } catch (error) {

                console.error(
                    "Add review error:",
                    error
                );

                if (message) {
                    message.textContent =
                        error.message ||
                        "Could not add review.";
                }
            }
        }
    );
}


/* =====================================================
   REVIEW ACTIONS
===================================================== */

async function toggleReview(reviewId) {

    try {

        const response =
            await fetch(
                `${API_URL}/reviews/${reviewId}/publish`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not update review."
            );
        }


        await loadAdminReviews();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Could not update review."
        );
    }
}


async function deleteReview(reviewId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this review?"
        );

    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/reviews/${reviewId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not delete review."
            );
        }


        await loadAdminReviews();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Could not delete review."
        );
    }
}


/* =====================================================
   CONTACT / BUSINESS / PAYMENT INFORMATION
===================================================== */

async function loadContact() {

    try {

        const response =
            await fetch(
                `${API_URL}/contact`
            );


        const data =
            await response.json();


        if (
            !data.success ||
            !data.contact
        ) {
            return;
        }


        const contact =
            data.contact;


        setElementValue(
            "contactWhatsapp",
            contact.whatsapp
        );

        setElementValue(
            "contactPhone",
            contact.phone
        );

        setElementValue(
            "contactEmail",
            contact.email
        );

        setElementValue(
            "contactInstagram",
            contact.instagram
        );

        setElementValue(
            "contactTiktok",
            contact.tiktok
        );

        setElementValue(
            "contactAddress",
            contact.address
        );

        setElementValue(
            "contactDeliveryAreas",
            contact.delivery_areas
        );

        setElementValue(
            "contactDeliveryFee",
            contact.delivery_fee
        );

        setElementValue(
            "contactPaymentMethods",
            contact.payment_methods
        );

        setElementValue(
            "contactRecommendationFee",
            contact.recommendation_fee
        );

        setElementValue(
            "contactBankName",
            contact.bank_name
        );

        setElementValue(
            "contactAccountName",
            contact.account_name
        );

        setElementValue(
            "contactAccountNumber",
            contact.account_number
        );


    } catch (error) {

        console.error(
            "Load contact error:",
            error
        );
    }
}


/* =====================================================
   SAVE CONTACT / BUSINESS / PAYMENT INFORMATION
===================================================== */

function initializeContactForm() {

    const contactForm =
        document.getElementById(
            "contactForm"
        );

    if (!contactForm) return;


    contactForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "contactMessage"
                );


            const contactData = {

                whatsapp:
                    getElementValue(
                        "contactWhatsapp"
                    ),

                phone:
                    getElementValue(
                        "contactPhone"
                    ),

                email:
                    getElementValue(
                        "contactEmail"
                    ),

                instagram:
                    getElementValue(
                        "contactInstagram"
                    ),

                tiktok:
                    getElementValue(
                        "contactTiktok"
                    ),

                address:
                    getElementValue(
                        "contactAddress"
                    ),

                delivery_areas:
                    getElementValue(
                        "contactDeliveryAreas"
                    ),

                delivery_fee:
                    getElementValue(
                        "contactDeliveryFee"
                    ),

                payment_methods:
                    getElementValue(
                        "contactPaymentMethods"
                    ),

                recommendation_fee:
                    getElementValue(
                        "contactRecommendationFee"
                    ),

                bank_name:
                    getElementValue(
                        "contactBankName"
                    ),

                account_name:
                    getElementValue(
                        "contactAccountName"
                    ),

                account_number:
                    getElementValue(
                        "contactAccountNumber"
                    )
            };


            try {

                if (message) {
                    message.textContent =
                        "Saving business information...";
                }


                const response =
                    await fetch(
                        `${API_URL}/contact`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    contactData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not save business information."
                    );
                }


                if (message) {
                    message.textContent =
                        "Business and payment information saved successfully!";
                }


            } catch (error) {

                console.error(
                    "Save contact error:",
                    error
                );


                if (message) {
                    message.textContent =
                        error.message ||
                        "Could not save business information.";
                }
            }
        }
    );
}


/* =====================================================
   ORDERS
===================================================== */

async function loadAdminOrders() {

    const container =
        document.getElementById(
            "adminOrders"
        );


    if (!container) return;


    try {

        const response =
            await fetch(
                `${API_URL}/orders`
            );


        const data =
            await response.json();


        if (!data.success) {

            container.innerHTML =
                "<p>Unable to load orders.</p>";

            return;
        }


        renderAdminOrders(
            data.orders
        );


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        container.innerHTML =
            "<p>Unable to load orders.</p>";
    }
}


function renderAdminOrders(orders) {

    const container =
        document.getElementById(
            "adminOrders"
        );


    if (!container) return;


    container.innerHTML = "";


    if (
        !orders ||
        orders.length === 0
    ) {

        container.innerHTML =
            "<p>No customer orders yet.</p>";

        return;
    }


    orders.forEach(function (order) {

        const card =
            document.createElement("div");


        card.className =
            "admin-product-item";


        let itemsText =
            escapeHtml(order.items || "");


        try {

            const parsedItems =
                JSON.parse(order.items);


            if (
                Array.isArray(parsedItems)
            ) {

                itemsText =
                    parsedItems
                        .map(function (item) {

                            return `
                                ${escapeHtml(item.name)}
                                × ${item.quantity}
                            `;

                        })
                        .join("<br>");
            }


        } catch (error) {

            // Keep original text.
        }


        card.innerHTML = `

            <div class="admin-product-info">

                <h3>
                    Order #${order.id}
                </h3>

                <p>
                    <strong>
                        ${escapeHtml(
                            order.customer_name
                        )}
                    </strong>
                </p>

                <small>
                    Email:
                    ${escapeHtml(
                        order.email || "Not provided"
                    )}
                </small>

                <small>
                    Phone:
                    ${escapeHtml(
                        order.phone || "Not provided"
                    )}
                </small>

                <small>
                    Address:
                    ${escapeHtml(
                        order.address || ""
                    )},
                    ${escapeHtml(
                        order.city || ""
                    )},
                    ${escapeHtml(
                        order.state || ""
                    )}
                </small>

                <small>
                    Payment:
                    ${escapeHtml(
                        order.payment_method ||
                        "Not provided"
                    )}
                </small>

                <small>
                    Payment Status:
                    ${escapeHtml(
                        order.payment_status ||
                        "Not provided"
                    )}
                </small>

                <p>
                    <strong>
                        Items
                    </strong>
                </p>

                <p>
                    ${itemsText}
                </p>

                <p>
                    <strong>
                        Total:
                        ₦${Number(
                            order.total || 0
                        ).toLocaleString()}
                    </strong>
                </p>

            </div>


            <div class="admin-product-actions">

                <label>
                    Status
                </label>


                <select
                    class="order-status"
                    data-id="${order.id}"
                >

                    <option
                        value="Pending"
                        ${
                            order.status === "Pending"
                                ? "selected"
                                : ""
                        }
                    >
                        Pending
                    </option>


                    <option
                        value="Processing"
                        ${
                            order.status === "Processing"
                                ? "selected"
                                : ""
                        }
                    >
                        Processing
                    </option>


                    <option
                        value="Shipped"
                        ${
                            order.status === "Shipped"
                                ? "selected"
                                : ""
                        }
                    >
                        Shipped
                    </option>


                    <option
                        value="Completed"
                        ${
                            order.status === "Completed"
                                ? "selected"
                                : ""
                        }
                    >
                        Completed
                    </option>


                    <option
                        value="Cancelled"
                        ${
                            order.status === "Cancelled"
                                ? "selected"
                                : ""
                        }
                    >
                        Cancelled
                    </option>

                </select>

            </div>
        `;


        container.appendChild(card);
    });
}


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not update order status."
            );
        }


        await loadAdminOrders();


    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );


        alert(
            error.message ||
            "Could not update order status."
        );
    }
}


/* =====================================================
   RECOMMENDATION REQUESTS
===================================================== */

async function loadRecommendationRequests() {

    const container =
        document.getElementById(
            "adminRecommendationRequests"
        );


    if (!container) return;


    try {

        const response =
            await fetch(
                `${API_URL}/recommendation-requests`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load recommendation requests"
            );
        }


        const data =
            await response.json();


        renderRecommendationRequests(
            data.requests || []
        );


    } catch (error) {

        console.error(
            "Recommendation request error:",
            error
        );


        container.innerHTML = `
            <p class="admin-message">
                Could not load recommendation requests.
            </p>
        `;
    }
}


function renderRecommendationRequests(requests) {

    const container =
        document.getElementById(
            "adminRecommendationRequests"
        );


    if (!container) return;


    if (!requests.length) {

        container.innerHTML = `
            <p class="admin-message">
                No recommendation requests yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        requests.map(function (request) {

            const status =
                request.status || "New";


            const statusClass =
                String(status)
                    .toLowerCase()
                    .replace(/\s+/g, "-");


            return `

                <div class="recommendation-request-card">

                    <div class="recommendation-request-header">

                        <div>

                            <span class="request-label">
                                SKIN ASSESSMENT REQUEST
                            </span>

                            <h3>
                                ${escapeHtml(
                                    request.customer_name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    request.customer_email ||
                                    "No email"
                                )}
                            </p>

                        </div>


                        <span
                            class="
                                recommendation-status-badge
                                status-${statusClass}
                            "
                        >
                            ${escapeHtml(status)}
                        </span>

                    </div>


                    <div class="recommendation-details">

                        <div>
                            <strong>Main Concern</strong>

                            <span>
                                ${escapeHtml(
                                    request.main_concern
                                )}
                            </span>
                        </div>


                        <div>
                            <strong>Skin Type</strong>

                            <span>
                                ${escapeHtml(
                                    request.skin_type
                                )}
                            </span>
                        </div>


                        <div>
                            <strong>Phone</strong>

                            <span>
                                ${escapeHtml(
                                    request.customer_phone ||
                                    "Not provided"
                                )}
                            </span>
                        </div>


                        <div>
                            <strong>Budget</strong>

                            <span>
                                ${escapeHtml(
                                    request.budget ||
                                    "Not provided"
                                )}
                            </span>
                        </div>


                        <div>
                            <strong>
                                Irritation / Breakouts
                            </strong>

                            <span>
                                ${escapeHtml(
                                    request.irritation ||
                                    "Not provided"
                                )}
                            </span>
                        </div>

                    </div>


                    <div class="recommendation-full-details">

                        <div class="recommendation-detail-block">

                            <strong>
                                Current Product
                            </strong>

                            <p>
                                ${escapeHtml(
                                    request.current_product ||
                                    "Not provided"
                                )}
                            </p>

                        </div>


                        <div class="recommendation-detail-block">

                            <strong>
                                Previous Products
                            </strong>

                            <p>
                                ${escapeHtml(
                                    request.previous_products ||
                                    "Not provided"
                                )}
                            </p>

                        </div>


                        <div class="recommendation-detail-block">

                            <strong>
                                Allergies / Ingredients to Avoid
                            </strong>

                            <p>
                                ${escapeHtml(
                                    request.allergies ||
                                    "None provided"
                                )}
                            </p>

                        </div>


                        <div class="recommendation-detail-block">

                            <strong>
                                Current Skincare Routine
                            </strong>

                            <p>
                                ${escapeHtml(
                                    request.routine ||
                                    "Not provided"
                                )}
                            </p>

                        </div>

                    </div>


                    <div class="recommendation-management">

                        <div class="form-group">

                            <label>
                                Recommended Product(s)
                            </label>

                            <textarea
                                id="recommendation-${request.id}"
                                rows="3"
                                placeholder="Enter the L’Aura product(s) recommended..."
                            >${escapeHtml(
                                request.recommendation || ""
                            )}</textarea>

                        </div>


                        <div class="form-group">

                            <label>
                                Recommendation Notes
                            </label>

                            <textarea
                                id="recommendation-notes-${request.id}"
                                rows="4"
                                placeholder="Add instructions, routine advice or notes for the customer..."
                            >${escapeHtml(
                                request.recommendation_notes || ""
                            )}</textarea>

                        </div>


                        <button
                            type="button"
                            class="admin-submit"
                            onclick="saveRecommendation(${request.id})"
                        >
                            Save Recommendation
                        </button>


                        <div class="recommendation-status-control">

                            <label>
                                Request Status
                            </label>

                            <select
                                onchange="
                                    updateRecommendationStatus(
                                        ${request.id},
                                        this.value
                                    )
                                "
                            >

                                <option
                                    value="New"
                                    ${
                                        status === "New"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    New
                                </option>


                                <option
                                    value="Reviewed"
                                    ${
                                        status === "Reviewed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Reviewed
                                </option>


                                <option
                                    value="Recommended"
                                    ${
                                        status === "Recommended"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Recommended
                                </option>


                                <option
                                    value="Completed"
                                    ${
                                        status === "Completed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Completed
                                </option>

                            </select>

                        </div>

                    </div>


                    <div class="recommendation-date">

                        Submitted:
                        ${escapeHtml(
                            request.created_at
                        )}

                    </div>

                </div>
            `;

        }).join("");
}


/* =====================================================
   SAVE RECOMMENDATION
===================================================== */

async function saveRecommendation(requestId) {

    const recommendationInput =
        document.getElementById(
            `recommendation-${requestId}`
        );


    const notesInput =
        document.getElementById(
            `recommendation-notes-${requestId}`
        );


    if (!recommendationInput) return;


    const recommendation =
        recommendationInput.value.trim();


    const recommendation_notes =
        notesInput
            ? notesInput.value.trim()
            : "";


    if (!recommendation) {

        alert(
            "Please enter the recommended product(s)."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/recommendation-requests/${requestId}/recommendation`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            recommendation,
                            recommendation_notes
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Failed to save recommendation."
            );
        }


        alert(
            "Recommendation saved successfully!"
        );


        await loadRecommendationRequests();


    } catch (error) {

        console.error(
            "Save recommendation error:",
            error
        );


        alert(
            error.message ||
            "Could not save recommendation."
        );
    }
}


/* =====================================================
   UPDATE RECOMMENDATION STATUS
===================================================== */

async function updateRecommendationStatus(
    requestId,
    status
) {

    try {

        const response =
            await fetch(
                `${API_URL}/recommendation-requests/${requestId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Failed to update status."
            );
        }


        await loadRecommendationRequests();


    } catch (error) {

        console.error(
            "Recommendation status error:",
            error
        );


        alert(
            error.message ||
            "Could not update the status."
        );


        await loadRecommendationRequests();
    }
}


/* =====================================================
   GLOBAL CLICK HANDLER
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const deleteProductButton =
            event.target.closest(
                ".delete-product"
            );


        if (deleteProductButton) {

            const productId =
                Number(
                    deleteProductButton.dataset.id
                );


            if (productId) {

                handleDeleteProduct(
                    productId
                );
            }

            return;
        }


        const toggleReviewButton =
            event.target.closest(
                ".toggle-review"
            );


        if (toggleReviewButton) {

            const reviewId =
                Number(
                    toggleReviewButton.dataset.id
                );


            if (reviewId) {

                toggleReview(
                    reviewId
                );
            }

            return;
        }


        const deleteReviewButton =
            event.target.closest(
                ".delete-review"
            );


        if (deleteReviewButton) {

            const reviewId =
                Number(
                    deleteReviewButton.dataset.id
                );


            if (reviewId) {

                deleteReview(
                    reviewId
                );
            }

            return;
        }
    }
);


/* =====================================================
   GLOBAL ORDER STATUS HANDLER
===================================================== */

document.addEventListener(
    "change",
    function (event) {

        const statusSelect =
            event.target.closest(
                ".order-status"
            );


        if (!statusSelect) return;


        const orderId =
            Number(
                statusSelect.dataset.id
            );


        const status =
            statusSelect.value;


        if (!orderId) return;


        updateOrderStatus(
            orderId,
            status
        );
    }
);


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeProductForm();

        initializeReviewForm();

        initializeContactForm();

        loadAdminProducts();

        loadAdminReviews();

        loadContact();

        loadAdminOrders();

        loadRecommendationRequests();

    }
);