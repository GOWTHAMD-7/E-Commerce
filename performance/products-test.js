import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '20s',
};

export default function () {
  const response = http.get('http://localhost:8080/products?page=0&size=50');

  check(response, {
    'status is 202': (r) => r.status === 202,
  });
}