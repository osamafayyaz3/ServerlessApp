import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtToken } from '../../auth/JwtToken';

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev-wbl3hipd.us.auth0.com/.well-known/jwks.json'

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJIyl2ziJsVXgbMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi13YmwzaGlwZC51cy5hdXRoMC5jb20wHhcNMjEwNjIwMDE0NjIzWhcN
MzUwMjI3MDE0NjIzWjAkMSIwIAYDVQQDExlkZXYtd2JsM2hpcGQudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArMThcilAMIdBcMjE
gDIIJ7+WSI/x0IHQs+qrYVGYA9Pz/bN3zR2WuWJydEGjINc0cCSuwZDSFO8etLKf
sa12dyASuqm4mDytJsuxnD1mRSd6+yUFMy7a3pSiLKEAewcZ0jHYYObyJC2juJYU
BfJDP9UDq7c8u5x9yWLBul9ClWqIEQAtzXHxYFOcoJGbj1B4lfezRd0ez6EFRuTb
Qz1pFtAbAiynsCLteWP0o5CT4Tlq+DULf4tmbygxjLE9VoWW5HN/2de71euEboXg
A/3wYlfGdW7AEYlOzlA1fK1wJsOpjBUaW3JjiK7CTAjUes1xM7ha0c9BIKNTKHmi
QravrQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTk1oTGrAVU
RVa7UUQoNIP6xb85kDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AEnXSDrJ/jjEa4INLr2nRScr/mHTZUuOU2t7FVK1RsZ4d043GhEw2g+zcBjCxasd
7jgLKowX8jSj91tj8IdnEXVgMttoOqhkC6SZk1GdnTsBZPIDmbpFcqhcQKDM3Tvp
jy7F0rRw8KDGElLX67el2Jx18wCYCp/yYVcrDMQv8QENbkelJ7Ew+UQ20yJRrRnh
STwh7MW2/BFz89u9fGqnpV5UL0B1atS57jTaW0CnOfGabKqSlCL50P2eSXZa6TrA
gXmEYuj6ed/B6T4CFmGx/5B1QSlOF97JHtwnsIcji/aeNlLXblbyRZtzx2ORWsQV
Ob8qC/l2/7gcIgw498QZBW8=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader) {
      throw new Error('No authorization header')
  }

  if (!authHeader.toLocaleLowerCase().startsWith('bearer')) {
      throw new Error('Invalid authorization header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}


