# Admin Setup Guide for Sheep Land

## Overview
The admin system now uses regular users with admin privileges instead of the PocketBase `_superusers` collection. This allows for more flexible user management where some regular users can have admin access.

## Default Admin Credentials
After running the setup, the following admin user is created:
- Email: `admin@sheep.land`
- Password: `admin123456`
- Status: Admin (is_admin: true)

## Setting Up Admin Users

### Method 1: Add Admin Field to Users Collection
1. Open your PocketBase admin dashboard
2. Go to Collections → users
3. Add a new field:
   - Field name: `is_admin` (or `admin` or `isAdmin`)
   - Field type: Bool
   - Default value: false
   - Required: No

4. Save the collection schema

5. To make a user an admin:
   - Go to the users collection records
   - Edit the user you want to make admin
   - Set `is_admin` to `true`
   - Save

### Method 2: Use Admin Email Addresses
The system also recognizes specific email addresses as admin accounts. By default, these emails have admin access:
- `admin@sheep.land`
- `admin@example.com`

You can modify this list in `/public/admin.js` by updating the `adminEmails` array in two places:
- Line 23 in `checkAdminAuth()` function
- Line 3537 in `loginAsAdmin()` function

## How Admin Authentication Works

1. User logs in through the regular login form
2. System checks if the user has:
   - `is_admin` field set to true, OR
   - `admin` field set to true, OR  
   - `isAdmin` field set to true, OR
   - Email address in the admin emails list

3. If any condition is met, the user gets admin panel access

## Accessing the Admin Panel

1. Add `#admin` to the URL (e.g., `https://sheep.land/#admin`)
2. If not logged in as admin, you'll see a login prompt
3. Use your admin user credentials to login
4. The admin panel will appear in the top-left corner

## Security Notes

- Admin status is checked both client-side and should be validated server-side for sensitive operations
- The PocketBase rules should include admin checks like: `@request.auth.admin = true`
- Always validate admin permissions in your PocketBase hooks and rules

## Troubleshooting

If admin login isn't working:
1. Check browser console for error messages
2. Verify the user has the admin field set to true in PocketBase
3. Ensure you're using the correct email/password
4. Clear browser localStorage and try again