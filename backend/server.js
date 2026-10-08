const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;


/* =====================================================
   BASIC SETUP
===================================================== */

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);


/* =====================================================
   DATABASE
===================================================== */

const db = new Database(
    path.join(__dirname, "l-aura.db")
);


/* =====================================================
   UPLOADS FOLDER
===================================================== */

const uploadsFolder = path.join(
    __dirname,
    "uploads"
);

if (!fs.existsSync(uploadsFolder)) {

    fs.mkdirSync(
        uploadsFolder,
        {
            recursive: true
        }
    );

}

app.use(
    "/uploads",
    express.static(uploadsFolder)
);


/* =====================================================
   MULTER IMAGE UPLOAD
===================================================== */

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            uploadsFolder
        );

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname);

        const filename =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1e9
            ) +
            extension;

        cb(
            null,
            filename
        );

    }

});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (
        req,
        file,
        cb
    ) {

        if (
            file.mimetype &&
            file.mimetype.startsWith(
                "image/"
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed."
                )
            );

        }

    }

});


/* =====================================================
   PRODUCTS TABLE
===================================================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS products (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        price REAL NOT NULL,

        description TEXT NOT NULL,

        skin_type TEXT NOT NULL,

        concern TEXT NOT NULL,

        image TEXT,

        stock INTEGER DEFAULT 0,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`).run();


/* =====================================================
   ORDERS TABLE
===================================================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        customer_name TEXT NOT NULL,

        email TEXT,

        phone TEXT,

        address TEXT,

        items TEXT NOT NULL,

        total REAL NOT NULL,

        status TEXT DEFAULT 'Pending',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`).run();


/* =====================================================
   ORDERS DATABASE UPGRADES
   Add fields needed for delivery and payments
===================================================== */

const orderColumns = db.prepare(`
    PRAGMA table_info(orders)
`).all();

const hasColumn = (columnName) =>
    orderColumns.some(
        column => column.name === columnName
    );


if (!hasColumn("city")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN city TEXT
    `).run();

}


if (!hasColumn("state")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN state TEXT
    `).run();

}


if (!hasColumn("payment_method")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN payment_method TEXT DEFAULT 'Bank Transfer'
    `).run();

}


if (!hasColumn("payment_status")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN payment_status TEXT DEFAULT 'Pending'
    `).run();

}


if (!hasColumn("payment_reference")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN payment_reference TEXT
    `).run();

}


if (!hasColumn("paid_at")) {

    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN paid_at DATETIME
    `).run();

}


/* =====================================================
   REVIEWS TABLE
===================================================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS reviews (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        customer_name TEXT NOT NULL,

        rating INTEGER NOT NULL,

        review TEXT NOT NULL,

        before_image TEXT,

        after_image TEXT,

        published INTEGER DEFAULT 1,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`).run();


/* =====================================================
   SKIN RECOMMENDATION REQUESTS TABLE
===================================================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS recommendation_requests (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        main_concern TEXT NOT NULL,

        current_product TEXT,

        skin_type TEXT NOT NULL,

        previous_products TEXT,

        budget TEXT,

        irritation TEXT,

        allergies TEXT,

        routine TEXT,

        customer_name TEXT NOT NULL,

        customer_email TEXT NOT NULL,

        customer_phone TEXT,

        status TEXT DEFAULT 'New',

        recommendation TEXT,

        recommendation_notes TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`).run();


/* =====================================================
   RECOMMENDATION REQUEST DATABASE MIGRATION
===================================================== */

try {

    db.prepare(`
        ALTER TABLE recommendation_requests
        ADD COLUMN recommendation TEXT
    `).run();

} catch (error) {

    if (
        !error.message.includes(
            "duplicate column name"
        )
    ) {

        console.error(
            "Recommendation column migration error:",
            error.message
        );

    }

}


try {

    db.prepare(`
        ALTER TABLE recommendation_requests
        ADD COLUMN recommendation_notes TEXT
    `).run();

} catch (error) {

    if (
        !error.message.includes(
            "duplicate column name"
        )
    ) {

        console.error(
            "Recommendation notes migration error:",
            error.message
        );

    }

}


/* =====================================================
   GET ALL RECOMMENDATION REQUESTS
===================================================== */

app.get(
    "/api/recommendation-requests",
    (req, res) => {

        try {

            const requests =
                db.prepare(`
                    SELECT *
                    FROM recommendation_requests
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                requests: requests

            });

        } catch (error) {

            console.error(
                "GET RECOMMENDATION REQUESTS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load recommendation requests."

            });

        }

    }
);


/* =====================================================
   ADD RECOMMENDATION REQUEST
===================================================== */

app.post(
    "/api/recommendation-requests",
    (req, res) => {

        try {

            const {

                mainConcern,

                currentProduct,

                skinType,

                previousProducts,

                budget,

                irritation,

                allergies,

                routine,

                customerName,

                customerEmail,

                customerPhone

            } = req.body;


            if (
                !mainConcern ||
                !skinType ||
                !customerName ||
                !customerEmail
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide your main concern, skin type, name and email."

                });

            }


            const result =
                db.prepare(`
                    INSERT INTO recommendation_requests
                    (
                        main_concern,
                        current_product,
                        skin_type,
                        previous_products,
                        budget,
                        irritation,
                        allergies,
                        routine,
                        customer_name,
                        customer_email,
                        customer_phone,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'New'
                    )
                `).run(

                    mainConcern,

                    currentProduct || "",

                    skinType,

                    previousProducts || "",

                    budget || "",

                    irritation || "",

                    allergies || "",

                    routine || "",

                    customerName,

                    customerEmail,

                    customerPhone || ""

                );


            const newRequest =
                db.prepare(`
                    SELECT *
                    FROM recommendation_requests
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );


            res.status(201).json({

                success: true,

                message:
                    "Skincare assessment submitted successfully.",

                request:
                    newRequest

            });

        } catch (error) {

            console.error(
                "ADD RECOMMENDATION REQUEST ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Could not submit skincare assessment."

            });

        }

    }
);


/* =====================================================
   CONTACT SETTINGS TABLE
===================================================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS contact_settings (

        id INTEGER PRIMARY KEY CHECK (id = 1),

        whatsapp TEXT,

        phone TEXT,

        email TEXT,

        instagram TEXT,

        tiktok TEXT,

        address TEXT,

        delivery_areas TEXT,

        delivery_fee TEXT,

        payment_methods TEXT,

        recommendation_fee TEXT,

        bank_name TEXT,

        account_name TEXT,

        account_number TEXT,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
`).run();


/* =====================================================
   CONTACT SETTINGS DATABASE MIGRATION
===================================================== */

const contactColumns = db.prepare(`
    PRAGMA table_info(contact_settings)
`).all();

const hasContactColumn = (columnName) =>
    contactColumns.some(
        column => column.name === columnName
    );


if (!hasContactColumn("tiktok")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN tiktok TEXT
    `).run();

}


if (!hasContactColumn("delivery_areas")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN delivery_areas TEXT
    `).run();

}


if (!hasContactColumn("delivery_fee")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN delivery_fee TEXT
    `).run();

}


if (!hasContactColumn("payment_methods")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN payment_methods TEXT
    `).run();

}


if (!hasContactColumn("recommendation_fee")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN recommendation_fee TEXT
    `).run();

}


if (!hasContactColumn("bank_name")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN bank_name TEXT
    `).run();

}


if (!hasContactColumn("account_name")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN account_name TEXT
    `).run();

}


if (!hasContactColumn("account_number")) {

    db.prepare(`
        ALTER TABLE contact_settings
        ADD COLUMN account_number TEXT
    `).run();

}


/* =====================================================
   DEFAULT CONTACT ROW
===================================================== */

const existingContact =
    db.prepare(
        "SELECT id FROM contact_settings WHERE id = 1"
    ).get();


if (!existingContact) {

    db.prepare(`
        INSERT INTO contact_settings
        (
            id,
            whatsapp,
            phone,
            email,
            instagram,
            tiktok,
            address,
            delivery_areas,
            delivery_fee,
            payment_methods,
            recommendation_fee,
            bank_name,
            account_name,
            account_number
        )
        VALUES
        (
            1,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `).run(

        "2349046819250",

        "",

        "lauraskinsation@gmail.com",

        "l_aura_skinsation",

        "l_aura_skinsation",

        "Kwara State / Lagos State / Nigeria",

        "Ilorin / Lagos State / Nationwide Nigeria",

        "Varies by location",

        "Paystack + Bank Transfer",

        "₦5,000 (Free when recommended products are purchased)",

        "",

        "",

        ""

    );

}


/* =====================================================
   SEED PRODUCTS
===================================================== */

const productCount =
    db.prepare(
        "SELECT COUNT(*) AS count FROM products"
    ).get();


if (productCount.count === 0) {

    const insertProduct =
        db.prepare(`
            INSERT INTO products
            (
                name,
                price,
                description,
                skin_type,
                concern,
                image,
                stock
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
        `);


    insertProduct.run(

        "Gentle Facial Cleanser",

        15000,

        "A gentle cleanser that removes dirt and impurities without stripping the skin.",

        "Normal, Dry, Sensitive",

        "Dryness, Weak Skin Barrier",

        "",

        10

    );


    insertProduct.run(

        "Brightening Serum",

        18000,

        "A lightweight serum designed to support a brighter and more even-looking complexion.",

        "Normal, Combination, Oily",

        "Dark Spots, Uneven Skin Tone, Dullness",

        "",

        10

    );


    insertProduct.run(

        "Barrier Repair Cream",

        20000,

        "A nourishing moisturizer designed to support and strengthen the skin barrier.",

        "Dry, Sensitive, Combination",

        "Dryness, Rough Texture, Weak Skin Barrier",

        "",

        10

    );

}


/* =====================================================
   TEST ROUTE
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "L’Aura backend is running."

        });

    }
);


/* =====================================================
   GET ALL PRODUCTS
===================================================== */

app.get(
    "/api/products",
    (req, res) => {

        try {

            const products =
                db.prepare(`
                    SELECT *
                    FROM products
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                products: products

            });

        } catch (error) {

            console.error(
                "GET PRODUCTS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load products."

            });

        }

    }
);


/* =====================================================
   GET ONE PRODUCT
===================================================== */

app.get(
    "/api/products/:id",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            res.json({

                success: true,

                product: product

            });

        } catch (error) {

            console.error(
                "GET PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load product."

            });

        }

    }
);


/* =====================================================
   ADD PRODUCT
===================================================== */

app.post(
    "/api/products",
    upload.single("image"),
    (req, res) => {

        try {

            const {

                name,

                price,

                description,

                skinType,

                skin_type,

                concern,

                stock

            } = req.body;


            const finalSkinType =
                skinType || skin_type;


            if (
                !name ||
                price === undefined ||
                !description ||
                !finalSkinType ||
                !concern
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide all required product information."

                });

            }


            const numericPrice =
                Number(price);


            const numericStock =
                Number(stock || 0);


            if (
                Number.isNaN(
                    numericPrice
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Product price must be a valid number."

                });

            }


            if (
                Number.isNaN(
                    numericStock
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Stock must be a valid number."

                });

            }


            let imagePath = "";


            if (req.file) {

                imagePath =
                    "/uploads/" +
                    req.file.filename;

            }


            const result =
                db.prepare(`
                    INSERT INTO products
                    (
                        name,
                        price,
                        description,
                        skin_type,
                        concern,
                        image,
                        stock
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `).run(

                    name,

                    numericPrice,

                    description,

                    finalSkinType,

                    concern,

                    imagePath,

                    numericStock

                );


            const newProduct =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );


            res.status(201).json({

                success: true,

                message:
                    "Product added successfully.",

                product:
                    newProduct

            });

        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "ADD PRODUCT ERROR:"
            );

            console.error(error);

            console.error(
                "================================="
            );


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Could not add product."

            });

        }

    }
);


/* =====================================================
   UPDATE PRODUCT
===================================================== */

app.put(
    "/api/products/:id",
    upload.single("image"),
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const existingProduct =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);


            if (!existingProduct) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            const {

                name,

                price,

                description,

                skinType,

                skin_type,

                concern,

                stock

            } = req.body;


            const finalSkinType =
                skinType || skin_type;


            if (
                !name ||
                price === undefined ||
                !description ||
                !finalSkinType ||
                !concern
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide all required product information."

                });

            }


            let imagePath =
                existingProduct.image || "";


            if (req.file) {

                imagePath =
                    "/uploads/" +
                    req.file.filename;


                if (
                    existingProduct.image &&
                    existingProduct.image.startsWith(
                        "/uploads/"
                    )
                ) {

                    const oldImagePath =
                        path.join(
                            __dirname,
                            existingProduct.image
                        );


                    if (
                        fs.existsSync(
                            oldImagePath
                        )
                    ) {

                        fs.unlinkSync(
                            oldImagePath
                        );

                    }

                }

            }


            db.prepare(`
                UPDATE products

                SET
                    name = ?,
                    price = ?,
                    description = ?,
                    skin_type = ?,
                    concern = ?,
                    image = ?,
                    stock = ?

                WHERE id = ?
            `).run(

                name,

                Number(price),

                description,

                finalSkinType,

                concern,

                imagePath,

                Number(stock || 0),

                id

            );


            const updatedProduct =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);


            res.json({

                success: true,

                message:
                    "Product updated successfully.",

                product:
                    updatedProduct

            });

        } catch (error) {

            console.error(
                "UPDATE PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Could not update product."

            });

        }

    }
);


/* =====================================================
   DELETE PRODUCT
===================================================== */

app.delete(
    "/api/products/:id",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found."

                });

            }


            if (
                product.image &&
                product.image.startsWith(
                    "/uploads/"
                )
            ) {

                const imagePath =
                    path.join(
                        __dirname,
                        product.image
                    );


                if (
                    fs.existsSync(
                        imagePath
                    )
                ) {

                    fs.unlinkSync(
                        imagePath
                    );

                }

            }


            db.prepare(`
                DELETE FROM products
                WHERE id = ?
            `).run(id);


            res.json({

                success: true,

                message:
                    "Product deleted successfully."

            });

        } catch (error) {

            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not delete product."

            });

        }

    }
);


/* =====================================================
   PUBLIC REVIEWS
===================================================== */

app.get(
    "/api/reviews",
    (req, res) => {

        try {

            const reviews =
                db.prepare(`
                    SELECT *
                    FROM reviews
                    WHERE published = 1
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                reviews: reviews

            });

        } catch (error) {

            console.error(
                "GET REVIEWS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load reviews."

            });

        }

    }
);


/* =====================================================
   ADMIN REVIEWS
===================================================== */

app.get(
    "/api/admin/reviews",
    (req, res) => {

        try {

            const reviews =
                db.prepare(`
                    SELECT *
                    FROM reviews
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                reviews: reviews

            });

        } catch (error) {

            console.error(
                "GET ADMIN REVIEWS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load admin reviews."

            });

        }

    }
);


/* =====================================================
   ADD REVIEW
===================================================== */

app.post(
    "/api/reviews",
    upload.fields([
        {
            name: "beforeImage",
            maxCount: 1
        },
        {
            name: "afterImage",
            maxCount: 1
        }
    ]),
    (req, res) => {

        try {

            const {

                customerName,

                rating,

                review

            } = req.body;


            if (
                !customerName ||
                !rating ||
                !review
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide the customer name, rating and review."

                });

            }


            let beforeImage = "";

            let afterImage = "";


            if (
                req.files &&
                req.files.beforeImage &&
                req.files.beforeImage[0]
            ) {

                beforeImage =
                    "/uploads/" +
                    req.files.beforeImage[0].filename;

            }


            if (
                req.files &&
                req.files.afterImage &&
                req.files.afterImage[0]
            ) {

                afterImage =
                    "/uploads/" +
                    req.files.afterImage[0].filename;

            }


            const result =
                db.prepare(`
                    INSERT INTO reviews
                    (
                        customer_name,
                        rating,
                        review,
                        before_image,
                        after_image,
                        published
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        1
                    )
                `).run(

                    customerName,

                    Number(rating),

                    review,

                    beforeImage,

                    afterImage

                );


            const newReview =
                db.prepare(`
                    SELECT *
                    FROM reviews
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );


            res.status(201).json({

                success: true,

                message:
                    "Review added successfully.",

                review:
                    newReview

            });

        } catch (error) {

            console.error(
                "ADD REVIEW ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Could not add review."

            });

        }

    }
);


/* =====================================================
   DELETE REVIEW
===================================================== */

app.delete(
    "/api/reviews/:id",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const review =
                db.prepare(`
                    SELECT *
                    FROM reviews
                    WHERE id = ?
                `).get(id);


            if (!review) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Review not found."

                });

            }


            const images = [

                review.before_image,

                review.after_image

            ];


            images.forEach(
                (image) => {

                    if (
                        image &&
                        image.startsWith(
                            "/uploads/"
                        )
                    ) {

                        const imagePath =
                            path.join(
                                __dirname,
                                image
                            );


                        if (
                            fs.existsSync(
                                imagePath
                            )
                        ) {

                            fs.unlinkSync(
                                imagePath
                            );

                        }

                    }

                }
            );


            db.prepare(`
                DELETE FROM reviews
                WHERE id = ?
            `).run(id);


            res.json({

                success: true,

                message:
                    "Review deleted successfully."

            });

        } catch (error) {

            console.error(
                "DELETE REVIEW ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not delete review."

            });

        }

    }
);


/* =====================================================
   PUBLISH / UNPUBLISH REVIEW
===================================================== */

app.put(
    "/api/reviews/:id/publish",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const published =
                req.body.published ? 1 : 0;


            db.prepare(`
                UPDATE reviews
                SET published = ?
                WHERE id = ?
            `).run(

                published,

                id

            );


            res.json({

                success: true,

                message:
                    "Review status updated."

            });

        } catch (error) {

            console.error(
                "PUBLISH REVIEW ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not update review."

            });

        }

    }
);


/* =====================================================
   UPDATE RECOMMENDATION REQUEST STATUS
===================================================== */

app.put(
    "/api/recommendation-requests/:id/status",
    (req, res) => {

        try {

            const {
                status
            } = req.body;


            const allowedStatuses = [

                "New",

                "Reviewed",

                "Recommended",

                "Completed"

            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid status"

                });

            }


            const result =
                db.prepare(`
                    UPDATE recommendation_requests

                    SET status = ?

                    WHERE id = ?
                `).run(

                    status,

                    req.params.id

                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Recommendation request not found"

                });

            }


            const request =
                db.prepare(`
                    SELECT *
                    FROM recommendation_requests
                    WHERE id = ?
                `).get(
                    req.params.id
                );


            res.json({

                success: true,

                request:
                    request

            });

        } catch (error) {

            console.error(
                "UPDATE RECOMMENDATION STATUS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Failed to update recommendation status"

            });

        }

    }
);


/* =====================================================
   SAVE SKINCARE RECOMMENDATION
===================================================== */

app.put(
    "/api/recommendation-requests/:id/recommendation",
    (req, res) => {

        try {

            const {

                recommendation,

                recommendation_notes

            } = req.body;


            if (
                !recommendation ||
                !recommendation.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please enter a recommendation."

                });

            }


            const result =
                db.prepare(`
                    UPDATE recommendation_requests

                    SET
                        recommendation = ?,
                        recommendation_notes = ?

                    WHERE id = ?
                `).run(

                    recommendation.trim(),

                    recommendation_notes
                        ? recommendation_notes.trim()
                        : "",

                    req.params.id

                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Recommendation request not found"

                });

            }


            const request =
                db.prepare(`
                    SELECT *
                    FROM recommendation_requests
                    WHERE id = ?
                `).get(
                    req.params.id
                );


            res.json({

                success: true,

                message:
                    "Recommendation saved successfully.",

                request:
                    request

            });

        } catch (error) {

            console.error(
                "SAVE RECOMMENDATION ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Failed to save recommendation."

            });

        }

    }
);


/* =====================================================
   GET CONTACT INFORMATION
===================================================== */

app.get(
    "/api/contact",
    (req, res) => {

        try {

            const contact =
                db.prepare(`
                    SELECT *
                    FROM contact_settings
                    WHERE id = 1
                `).get();


            res.json({

                success: true,

                contact:
                    contact

            });

        } catch (error) {

            console.error(
                "GET CONTACT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load contact information."

            });

        }

    }
);


/* =====================================================
   SAVE CONTACT INFORMATION
===================================================== */

app.put(
    "/api/contact",
    (req, res) => {

        try {

            const {

                whatsapp,

                phone,

                email,

                instagram,

                tiktok,

                address,

                delivery_areas,

                delivery_fee,

                payment_methods,

                recommendation_fee,

                bank_name,

                account_name,

                account_number

            } = req.body;


            db.prepare(`
                UPDATE contact_settings

                SET
                    whatsapp = ?,
                    phone = ?,
                    email = ?,
                    instagram = ?,
                    tiktok = ?,
                    address = ?,
                    delivery_areas = ?,
                    delivery_fee = ?,
                    payment_methods = ?,
                    recommendation_fee = ?,
                    bank_name = ?,
                    account_name = ?,
                    account_number = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = 1
            `).run(

                whatsapp || "",

                phone || "",

                email || "",

                instagram || "",

                tiktok || "",

                address || "",

                delivery_areas || "",

                delivery_fee || "",

                payment_methods || "",

                recommendation_fee || "",

                bank_name || "",

                account_name || "",

                account_number || ""

            );


            const contact =
                db.prepare(`
                    SELECT *
                    FROM contact_settings
                    WHERE id = 1
                `).get();


            res.json({

                success: true,

                message:
                    "Contact information saved successfully.",

                contact:
                    contact

            });

        } catch (error) {

            console.error(
                "SAVE CONTACT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not save contact information."

            });

        }

    }
);


/* =====================================================
   GET ORDERS
===================================================== */

app.get(
    "/api/orders",
    (req, res) => {

        try {

            const orders =
                db.prepare(`
                    SELECT *
                    FROM orders
                    ORDER BY id DESC
                `).all();


            res.json({

                success: true,

                orders: orders

            });

        } catch (error) {

            console.error(
                "GET ORDERS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load orders."

            });

        }

    }
);


/* =====================================================
   CREATE ORDER
===================================================== */

app.post(
    "/api/orders",
    (req, res) => {

        try {

            const {

                name,

                customer_name,

                email,

                phone,

                address,

                city,

                state,

                items,

                total,

                payment_method,

                payment_status,

                payment_reference

            } = req.body;


            const customerName =
                name || customer_name;


            if (
                !customerName ||
                !items ||
                total === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide all required order information."

                });

            }


            const orderItems =
                typeof items === "string"

                    ? items

                    : JSON.stringify(items);


            const finalPaymentMethod =
                payment_method ||
                "Bank Transfer";


            const finalPaymentStatus =
                payment_status ||
                "Pending";


            const finalPaymentReference =
                payment_reference ||
                "";


            const numericTotal =
                Number(total);


            if (
                Number.isNaN(
                    numericTotal
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Order total must be a valid number."

                });

            }


            const result =
                db.prepare(`
                    INSERT INTO orders
                    (
                        customer_name,
                        email,
                        phone,
                        address,
                        city,
                        state,
                        items,
                        total,
                        status,
                        payment_method,
                        payment_status,
                        payment_reference
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'Pending',
                        ?,
                        ?,
                        ?
                    )
                `).run(

                    customerName,

                    email || "",

                    phone || "",

                    address || "",

                    city || "",

                    state || "",

                    orderItems,

                    numericTotal,

                    finalPaymentMethod,

                    finalPaymentStatus,

                    finalPaymentReference

                );


            const order =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );


            res.status(201).json({

                success: true,

                message:
                    "Order created successfully.",

                order:
                    order

            });

        } catch (error) {

            console.error(
                "CREATE ORDER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Could not create order."

            });

        }

    }
);


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

app.put(
    "/api/orders/:id/status",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const {
                status
            } = req.body;


            if (!status) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Order status is required."

                });

            }


            db.prepare(`
                UPDATE orders

                SET status = ?

                WHERE id = ?
            `).run(

                status,

                id

            );


            const order =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `).get(id);


            res.json({

                success: true,

                message:
                    "Order status updated.",

                order:
                    order

            });

        } catch (error) {

            console.error(
                "UPDATE ORDER STATUS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not update order status."

            });

        }

    }
);


/* =====================================================
   MULTER ERROR HANDLER
===================================================== */

app.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            console.error(
                "MULTER ERROR:",
                error
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        if (error) {

            console.error(
                "SERVER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Server error."

            });

        }


        next();

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    () => {

        console.log(
            `L'Aura backend running at http://localhost:${PORT}`
        );

    }
);