exports.serde = (title) => {
    return [
        '',
        'help',
        'data-model',
        'derive',
        {
          title: '属性',
          collapsable: true,
          children: [
            'attribute/attributes',
            'attribute/container-attrs',
            'attribute/variant-attrs',
            'attribute/field-attrs'
          ]
        },
        {
            title: '自定义序列化',
            collapsable: true,
            children: [
              'custom/custom-serialization',
              'custom/impl-serialize',
              'custom/impl-deserialize',
              'custom/unit-testing'
            ]
        },
        {
            title: '编写数据格式',
            collapsable: true,
            children: [
              'data/data-format',
              'data/conventions',
              'data/error-handling',
              'data/impl-serializer',
              'data/impl-deserializer'
            ]
        },
        'lifetimes',
        {
            title: '示例',
            collapsable: true,
            children: [
              'examples/examples',
              'examples/json',
              'examples/enum-representations',
              'examples/attr-default',
              'examples/attr-flatten',
              'examples/attr-bound',
              'examples/deserialize-map',
              'examples/stream-array',
              'examples/enum-number',
              'examples/attr-rename',
              'examples/attr-skip-serializing',
              'examples/remote-derive',
              'examples/deserialize-struct',
              'examples/ignored-any',
              'examples/transcode',
              'examples/string-or-struct',
              'examples/convert-error',
              'examples/custom-date-format'
            ]
        },
        'no-std',
        'feature-flags'
    ]
}
