exports.actixweb = (title) => {
    return [
        '',
        {
          title: '介绍',
          collapsable: true,
          children: [
            'whatisactix',
            'installation'
          ]
        },
        {
          title: '基本',
          collapsable: true,
          children: [
            'getting-started',
            'application',
            'server',
            'handler',
            'extractors'
          ]
        },
        {
          title: '高级',
          collapsable: true,
          children: [
            'error',
            'URL-Dispatch',
            'request',
            'response',
            'test',
            'middleare',
            'staticfile'
          ]
        },
        {
          title: '协议',
          collapsable: true,
          children: [
            'websocket',
            'HTTP2'
          ]
        },
        {
          title: '主题',
          collapsable: true,
          children: [
            'autoreloade',
            'database',
            'sentry'
          ]
        }
    ]
}