const handleRateLimitError = (customMessage?: string): any => {
    return {
        statusCode: 429,
        message: customMessage || 'Too many requests, please try again later.',
        errorSources: [
            {
                path: '',
                message: customMessage || 'Rate limit exceeded. Please wait before retrying.',
            },
        ],
    };
};

export default handleRateLimitError;