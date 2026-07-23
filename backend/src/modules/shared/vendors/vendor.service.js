import prisma from '../../../config/db.js'

const defaultCompanyId = async () => {
  const company = await prisma.companies.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })
  if (!company) {
    const error = new Error('A company must exist before creating vendors')
    error.status = 400
    throw error
  }
  return company.id
}
export const listVendors = () => prisma.vendors.findMany({ orderBy: { created_at: 'desc' } })
export const findVendor = (id) => prisma.vendors.findUnique({ where: { id } })
export const createVendorRecord = async (data) => prisma.vendors.create({ data: { ...data, company_id: data.company_id || await defaultCompanyId() } })
export const updateVendorRecord = (id, data) => prisma.vendors.update({ where: { id }, data: { ...data, updated_at: new Date() } })
export const deleteVendorRecord = async (id) => {
  const record = await prisma.vendors.findUnique({ where: { id }, include: { vendor_bills: { select: { id: true }, take: 1 }, vendor_payments: { select: { id: true }, take: 1 } } })
  if (!record) return false
  if (record.vendor_bills.length || record.vendor_payments.length) {
    const error = new Error('Cannot delete a vendor with existing accounting transactions')
    error.status = 400
    throw error
  }
  await prisma.vendors.delete({ where: { id } })
  return record
}
