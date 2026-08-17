CREATE TABLE users (
    id UUID PRIMARY KEY,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE payments (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    reference VARCHAR(255) NOT NULL UNIQUE,

    amount BIGINT NOT NULL,

    currency VARCHAR(3) NOT NULL,

    status VARCHAR(20) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT payment_status_check
        CHECK (
            status IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'CANCELLED'
            )
        ),

    CONSTRAINT payment_amount_check
        CHECK (amount > 0)
);


CREATE TABLE todos (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    payment_id UUID NOT NULL UNIQUE,

    title VARCHAR(255) NOT NULL,

    status VARCHAR(20) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_todo_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_todo_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id),

    CONSTRAINT todo_status_check
        CHECK (
            status IN (
                'ACTIVE',
                'COMPLETED'
            )
        )
);