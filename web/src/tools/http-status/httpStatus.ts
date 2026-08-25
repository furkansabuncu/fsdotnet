export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

export interface HttpStatus {
  code: number;
  /** RFC'deki resmî sebep ifadesi. */
  name: string;
  /**
   * ASP.NET Core'daki `StatusCodes` sabiti.
   *
   * Bu aracın diğer HTTP referanslarında olmayan tarafı bu: kodu bulup
   * doğrudan `StatusCodes.Status404NotFound` yazabiliyorsunuz.
   * Bazı kodların .NET karşılığı yoktur (ör. 218) — o zaman null.
   */
  dotnet: string | null;
  /** Kısa açıklama. RFC terminolojisi olduğu için ÇEVRİLMİYOR. */
  summary: string;
}

const status = (
  code: number,
  name: string,
  dotnet: string | null,
  summary: string,
): HttpStatus => ({ code, name, dotnet, summary });

export const HTTP_STATUSES: readonly HttpStatus[] = [
  status(100, 'Continue', 'Status100Continue', 'Client should continue with the request body.'),
  status(101, 'Switching Protocols', 'Status101SwitchingProtocols', 'Server is switching protocol, e.g. to WebSocket.'),
  status(102, 'Processing', 'Status102Processing', 'WebDAV: request received, still working on it.'),
  status(103, 'Early Hints', 'Status103EarlyHints', 'Preload hints sent before the final response.'),

  status(200, 'OK', 'Status200OK', 'Standard success.'),
  status(201, 'Created', 'Status201Created', 'Resource created; Location header points to it.'),
  status(202, 'Accepted', 'Status202Accepted', 'Accepted for processing, not finished yet.'),
  status(203, 'Non-Authoritative Information', 'Status203NonAuthoritative', 'Body was modified by a proxy.'),
  status(204, 'No Content', 'Status204NoContent', 'Success with no body — do not send one.'),
  status(205, 'Reset Content', 'Status205ResetContent', 'Success; client should clear the form.'),
  status(206, 'Partial Content', 'Status206PartialContent', 'Range request satisfied.'),
  status(207, 'Multi-Status', 'Status207MultiStatus', 'WebDAV: multiple independent results.'),
  status(208, 'Already Reported', 'Status208AlreadyReported', 'WebDAV: members already listed.'),
  status(226, 'IM Used', 'Status226IMUsed', 'Response is the result of instance manipulations.'),

  status(300, 'Multiple Choices', 'Status300MultipleChoices', 'Several representations to choose from.'),
  status(301, 'Moved Permanently', 'Status301MovedPermanently', 'Permanent redirect; update your links.'),
  status(302, 'Found', 'Status302Found', 'Temporary redirect; method may change to GET.'),
  status(303, 'See Other', 'Status303SeeOther', 'Follow up with GET on another URL.'),
  status(304, 'Not Modified', 'Status304NotModified', 'Cached copy is still fresh.'),
  status(307, 'Temporary Redirect', 'Status307TemporaryRedirect', 'Temporary redirect; method is preserved.'),
  status(308, 'Permanent Redirect', 'Status308PermanentRedirect', 'Permanent redirect; method is preserved.'),

  status(400, 'Bad Request', 'Status400BadRequest', 'Malformed request the server refuses to process.'),
  status(401, 'Unauthorized', 'Status401Unauthorized', 'Not authenticated — despite the name.'),
  status(402, 'Payment Required', 'Status402PaymentRequired', 'Reserved; used by some APIs for billing.'),
  status(403, 'Forbidden', 'Status403Forbidden', 'Authenticated but not allowed.'),
  status(404, 'Not Found', 'Status404NotFound', 'No resource at this URL.'),
  status(405, 'Method Not Allowed', 'Status405MethodNotAllowed', 'Wrong verb; Allow header lists the right ones.'),
  status(406, 'Not Acceptable', 'Status406NotAcceptable', 'Cannot satisfy the Accept header.'),
  status(407, 'Proxy Authentication Required', 'Status407ProxyAuthenticationRequired', 'Authenticate with the proxy first.'),
  status(408, 'Request Timeout', 'Status408RequestTimeout', 'Client took too long to send the request.'),
  status(409, 'Conflict', 'Status409Conflict', 'State conflict, e.g. a concurrent edit.'),
  status(410, 'Gone', 'Status410Gone', 'Deliberately removed and will not come back.'),
  status(411, 'Length Required', 'Status411LengthRequired', 'Content-Length header is missing.'),
  status(412, 'Precondition Failed', 'Status412PreconditionFailed', 'If-Match or similar precondition failed.'),
  status(413, 'Content Too Large', 'Status413PayloadTooLarge', 'Body exceeds the server limit.'),
  status(414, 'URI Too Long', 'Status414UriTooLong', 'URL is longer than the server accepts.'),
  status(415, 'Unsupported Media Type', 'Status415UnsupportedMediaType', 'Content-Type the server cannot read.'),
  status(416, 'Range Not Satisfiable', 'Status416RangeNotSatisfiable', 'Requested range is outside the resource.'),
  status(417, 'Expectation Failed', 'Status417ExpectationFailed', 'Expect header cannot be met.'),
  status(418, "I'm a teapot", 'Status418ImATeapot', 'April Fools RFC 2324; still in the enum.'),
  status(421, 'Misdirected Request', 'Status421MisdirectedRequest', 'Server cannot produce a response for this authority.'),
  status(422, 'Unprocessable Content', 'Status422UnprocessableEntity', 'Syntax fine, semantics wrong — validation errors.'),
  status(423, 'Locked', 'Status423Locked', 'WebDAV: resource is locked.'),
  status(424, 'Failed Dependency', 'Status424FailedDependency', 'WebDAV: a dependent request failed.'),
  status(426, 'Upgrade Required', 'Status426UpgradeRequired', 'Switch protocol, see the Upgrade header.'),
  status(428, 'Precondition Required', 'Status428PreconditionRequired', 'Server demands a conditional request.'),
  status(429, 'Too Many Requests', 'Status429TooManyRequests', 'Rate limited; check Retry-After.'),
  status(431, 'Request Header Fields Too Large', 'Status431RequestHeaderFieldsTooLarge', 'Headers exceed the server limit.'),
  status(451, 'Unavailable For Legal Reasons', 'Status451UnavailableForLegalReasons', 'Blocked for legal reasons.'),

  status(500, 'Internal Server Error', 'Status500InternalServerError', 'Unhandled failure on the server.'),
  status(501, 'Not Implemented', 'Status501NotImplemented', 'Server does not support this functionality.'),
  status(502, 'Bad Gateway', 'Status502BadGateway', 'Upstream server returned something invalid.'),
  status(503, 'Service Unavailable', 'Status503ServiceUnavailable', 'Temporarily down or overloaded.'),
  status(504, 'Gateway Timeout', 'Status504GatewayTimeout', 'Upstream server did not answer in time.'),
  status(505, 'HTTP Version Not Supported', 'Status505HttpVersionNotsupported', 'Protocol version is not supported.'),
  status(507, 'Insufficient Storage', 'Status507InsufficientStorage', 'WebDAV: not enough space to finish.'),
  status(508, 'Loop Detected', 'Status508LoopDetected', 'WebDAV: infinite loop while processing.'),
  status(511, 'Network Authentication Required', 'Status511NetworkAuthenticationRequired', 'Captive portal wants you to log in.'),
];

export function statusClass(code: number): StatusClass {
  return `${Math.floor(code / 100)}xx` as StatusClass;
}

export const STATUS_CLASSES: readonly StatusClass[] = ['1xx', '2xx', '3xx', '4xx', '5xx'];

/**
 * Koda, ada, .NET sabitine ve açıklamaya bakan basit arama.
 *
 * Kod araması ÖNEK eşleşmesi: "40" yazınca 400-409 gelir, ama 1400 gibi bir
 * şey aranmaz — sayısal alanda alt dize eşleşmesi gürültü üretiyor.
 */
export function searchStatuses(query: string, only: StatusClass | 'all'): HttpStatus[] {
  const q = query.trim().toLowerCase();

  return HTTP_STATUSES.filter((item) => {
    if (only !== 'all' && statusClass(item.code) !== only) return false;
    if (q === '') return true;

    return (
      String(item.code).startsWith(q) ||
      item.name.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      (item.dotnet?.toLowerCase().includes(q) ?? false)
    );
  });
}
