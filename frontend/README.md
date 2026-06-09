# Northstar Market

Simple React storefront for practicing a Spring Boot backend integration.

## Run locally

1. Set your API base URL in `.env` if your backend is not running on `http://localhost:8080`.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.

## Backend contract

The frontend first tries `GET /api/products`, then `GET /products/all`, then `GET /products`. Each endpoint can return either an array of products or a paged response with a `content` array.

Supported product fields:

- `id` or `productId`
- `name` or `title`
- `description`
- `price`
- `imageUrl` or `image`
- `category` or `categoryName`
- `rating`
- `inventory` or `stock`
