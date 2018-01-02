{
  "targets": [{
    "target_name": "crc64_ecma182_base",
    "sources": [
      "src/crc64_ecma_182.cc"
    ],
    "type": "static_library"
  }, {
    "target_name": "crc64_ecma182",
    "sources": [
      "src/node_crc64_ecma_182.cc"
    ],
    "dependencies": [
      "crc64_ecma182_base"
    ],
    "include_dirs": [
      "<!(node -e \"require('nan')\")"
    ]
  }]
}
