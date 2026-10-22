import type { FeatureCollection } from 'geojson';

// Authentic simplified India States and Union Territories GeoJSON
export const indiaStatesGeoJSON: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "code": "JK", "name": "Jammu and Kashmir", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.8, 33.2], [74.3, 34.2], [74.8, 34.8], [75.5, 34.6], [76.2, 33.8], [75.8, 33.0], [74.9, 32.7], [74.2, 32.8], [73.8, 33.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "LA", "name": "Ladakh", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.6, 34.6], [76.8, 35.5], [77.8, 35.8], [79.2, 35.0], [79.8, 34.2], [79.2, 33.1], [78.2, 32.8], [76.8, 33.4], [75.6, 34.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "HP", "name": "Himachal Pradesh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.8, 32.2], [76.6, 33.2], [77.5, 33.0], [78.6, 32.2], [79.0, 31.4], [78.2, 31.0], [77.4, 30.6], [76.4, 31.2], [75.8, 32.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "PB", "name": "Punjab", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.5, 31.8], [75.5, 32.4], [76.3, 31.4], [76.8, 30.8], [76.2, 29.9], [75.0, 29.8], [74.2, 30.4], [74.5, 31.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "CH", "name": "Chandigarh", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.73, 30.70], [76.82, 30.70], [76.82, 30.78], [76.73, 30.78], [76.73, 30.70]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "UK", "name": "Uttarakhand", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.7, 30.8], [78.6, 31.4], [79.5, 31.2], [80.6, 30.5], [80.9, 29.8], [79.9, 28.9], [78.8, 29.5], [77.9, 30.2], [77.7, 30.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "HR", "name": "Haryana", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.8, 29.6], [75.8, 30.4], [76.8, 30.5], [77.3, 29.8], [77.4, 28.4], [76.8, 27.9], [75.9, 28.2], [74.9, 28.8], [74.8, 29.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "DL", "name": "Delhi", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.95, 28.50], [77.20, 28.85], [77.32, 28.75], [77.30, 28.45], [77.10, 28.40], [76.95, 28.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "RJ", "name": "Rajasthan", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[70.0, 27.5], [70.5, 28.4], [72.5, 29.8], [74.0, 29.8], [75.5, 28.5], [77.2, 27.8], [77.8, 26.8], [76.8, 24.5], [74.5, 23.5], [73.2, 24.5], [71.0, 25.0], [69.6, 26.4], [70.0, 27.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "UP", "name": "Uttar Pradesh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.5, 29.5], [78.8, 29.2], [80.2, 28.5], [81.8, 28.2], [83.5, 27.4], [84.4, 26.5], [83.8, 24.5], [82.6, 24.0], [80.8, 25.0], [78.5, 24.8], [77.8, 26.8], [77.2, 28.2], [77.5, 29.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "BR", "name": "Bihar", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.8, 27.2], [84.6, 27.5], [86.5, 26.8], [88.1, 26.4], [87.8, 25.2], [86.8, 24.6], [84.8, 24.6], [83.6, 25.0], [83.8, 27.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "SK", "name": "Sikkim", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[88.1, 27.8], [88.6, 28.1], [88.9, 27.7], [88.8, 27.1], [88.2, 27.2], [88.1, 27.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "WB", "name": "West Bengal", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[88.2, 27.1], [88.9, 27.0], [89.8, 26.5], [88.8, 25.8], [88.4, 24.5], [88.8, 22.8], [88.4, 21.6], [87.5, 21.8], [86.8, 22.6], [86.8, 24.2], [87.8, 25.2], [88.2, 27.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "JH", "name": "Jharkhand", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.6, 24.4], [85.5, 24.8], [87.2, 24.6], [87.4, 23.6], [86.5, 22.4], [85.2, 22.2], [84.2, 22.8], [83.6, 24.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "OR", "name": "Odisha", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[84.0, 22.2], [85.5, 22.4], [86.8, 22.2], [87.0, 21.4], [86.0, 19.8], [85.0, 19.2], [84.0, 18.8], [82.5, 18.2], [82.4, 19.5], [83.2, 20.8], [84.0, 22.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "CT", "name": "Chhattisgarh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[82.5, 24.0], [83.6, 23.8], [83.8, 22.4], [82.8, 21.2], [82.2, 18.8], [81.2, 17.8], [80.5, 19.2], [80.8, 21.2], [81.5, 22.8], [82.5, 24.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "MP", "name": "Madhya Pradesh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.5, 25.0], [76.5, 26.4], [78.5, 26.8], [80.5, 25.2], [82.5, 24.5], [82.0, 23.2], [81.5, 21.8], [78.8, 21.4], [76.2, 21.4], [74.5, 22.2], [74.2, 23.8], [74.5, 25.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "GJ", "name": "Gujarat", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[68.5, 23.5], [70.0, 24.4], [71.8, 24.5], [73.5, 24.0], [74.2, 22.4], [73.5, 21.0], [72.8, 20.4], [72.4, 21.2], [70.5, 20.8], [69.2, 22.0], [68.8, 23.0], [68.5, 23.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "MH", "name": "Maharashtra", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.0, 20.1], [74.5, 21.8], [77.5, 21.5], [79.8, 21.4], [80.8, 20.8], [80.2, 18.8], [78.2, 18.5], [76.5, 17.5], [74.5, 16.0], [73.5, 15.8], [72.8, 18.5], [72.8, 19.8], [73.0, 20.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "GA", "name": "Goa", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.7, 15.7], [74.2, 15.7], [74.3, 14.9], [73.9, 14.9], [73.7, 15.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "KA", "name": "Karnataka", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.2, 15.6], [75.5, 17.2], [77.2, 18.2], [77.5, 17.0], [78.2, 15.0], [78.2, 13.5], [77.5, 12.0], [76.5, 11.8], [75.0, 12.8], [74.3, 14.2], [74.2, 15.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "TS", "name": "Telangana", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.5, 18.8], [78.8, 19.8], [80.2, 18.8], [81.0, 17.8], [79.8, 16.8], [78.2, 16.2], [77.4, 17.5], [77.5, 18.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "AP", "name": "Andhra Pradesh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.2, 15.2], [79.5, 16.2], [80.8, 16.5], [82.5, 17.5], [83.8, 18.5], [84.6, 19.2], [83.2, 18.0], [80.4, 15.5], [80.0, 13.5], [79.2, 13.2], [78.2, 14.0], [77.2, 15.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "TN", "name": "Tamil Nadu", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.5, 12.0], [79.2, 13.2], [80.2, 13.2], [79.8, 11.2], [79.2, 9.8], [77.8, 8.1], [77.2, 8.8], [76.8, 10.2], [76.5, 11.5], [77.5, 12.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "KL", "name": "Kerala", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.9, 12.6], [75.6, 12.4], [76.4, 11.6], [76.8, 10.2], [77.2, 8.8], [77.4, 8.2], [76.9, 8.4], [76.2, 9.8], [75.3, 11.5], [74.9, 12.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "AS", "name": "Assam", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.8, 26.2], [91.5, 26.8], [93.2, 26.8], [95.2, 27.8], [95.8, 27.2], [94.5, 26.2], [93.2, 25.5], [92.2, 25.8], [91.5, 25.4], [90.2, 25.8], [89.8, 26.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "AR", "name": "Arunachal Pradesh", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.8, 27.2], [92.5, 28.2], [94.5, 28.8], [96.5, 28.5], [97.2, 28.0], [96.5, 27.2], [95.2, 27.8], [93.5, 27.2], [91.8, 27.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "ML", "name": "Meghalaya", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[90.0, 25.8], [91.5, 25.8], [92.6, 25.6], [92.5, 25.1], [91.2, 25.2], [90.0, 25.3], [90.0, 25.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "NL", "name": "Nagaland", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.5, 25.6], [94.5, 26.2], [95.2, 26.8], [95.2, 26.2], [94.5, 25.4], [93.5, 25.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "MN", "name": "Manipur", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.4, 25.4], [94.5, 25.4], [94.6, 24.4], [93.8, 23.9], [93.2, 24.4], [93.4, 25.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "MZ", "name": "Mizoram", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.4, 24.3], [93.2, 24.2], [93.4, 23.2], [92.8, 22.0], [92.4, 22.5], [92.4, 24.3]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "TR", "name": "Tripura", "type": "State" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.2, 24.2], [92.2, 24.3], [92.2, 23.4], [91.8, 23.0], [91.2, 23.5], [91.2, 24.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "AN", "name": "Andaman and Nicobar Islands", "type": "UT" },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[92.6, 11.5], [92.9, 11.5], [92.9, 12.5], [92.6, 12.5], [92.6, 11.5]]],
          [[[93.6, 7.0], [93.9, 7.0], [93.9, 7.6], [93.6, 7.6], [93.6, 7.0]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "LD", "name": "Lakshadweep", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.4, 10.4], [72.8, 10.4], [72.8, 11.0], [72.4, 11.0], [72.4, 10.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "PY", "name": "Puducherry", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[79.7, 11.8], [79.9, 11.8], [79.9, 12.0], [79.7, 12.0], [79.7, 11.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "code": "DN", "name": "Dadra & Nagar Haveli and Daman & Diu", "type": "UT" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.7, 20.2], [73.1, 20.2], [73.1, 20.6], [72.7, 20.6], [72.7, 20.2]]]
      }
    }
  ]
};