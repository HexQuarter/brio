
const prod = process.env['PROD'] || true
export const USER_TABLE = prod === true ? 'users' : 'users_dev'
export const USER_CONTACT_TABLE = prod === true ? 'user_contacts' : 'user_contacts_dev'