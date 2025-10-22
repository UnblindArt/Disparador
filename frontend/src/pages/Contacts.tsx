import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, Plus, Search, Trash2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { contactsAPI } from '../services/api'
import { Contact } from '../types'
import { formatPhone } from '../lib/utils'

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' })
  const queryClient = useQueryClient()

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsAPI.getAll()
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => contactsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Paciente adicionado!')
      setShowForm(false)
      setNewContact({ name: '', phone: '', email: '' })
    },
    onError: () => toast.error('Erro ao adicionar paciente'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Paciente removido!')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (contacts: any[]) => contactsAPI.bulkImport(contacts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Arquivo importado com sucesso!')
    },
    onError: () => toast.error('Erro ao importar arquivo'),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/xml': ['.xml'],
      'application/pdf': ['.pdf'],
    },
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return

      const extension = file.name.split('.').pop()?.toLowerCase()

      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const contacts = results.data.map((row: any) => ({
              name: row.nome || row.name || '',
              phone: row.telefone || row.phone || '',
              email: row.email || '',
            })).filter((c: any) => c.phone)
            uploadMutation.mutate(contacts)
          },
        })
      } else if (extension === 'xls' || extension === 'xlsx') {
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json: any[] = XLSX.utils.sheet_to_json(sheet)
          const contacts = json.map((row) => ({
            name: row.nome || row.name || row.Nome || row.Name || '',
            phone: row.telefone || row.phone || row.Telefone || row.Phone || '',
            email: row.email || row.Email || '',
          })).filter((c) => c.phone)
          uploadMutation.mutate(contacts)
        }
        reader.readAsArrayBuffer(file)
      } else {
        toast.error('Formato não suportado. Use CSV ou XLSX.')
      }
    },
  })

  const filtered = contacts?.filter((c: Contact) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pacientes</h1>
          <p className="text-clinic-gray-300">Gerencie sua lista de pacientes</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={18} className="mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Upload de Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-clinic-royal bg-clinic-royal/10'
                : 'border-clinic-gray-600 hover:border-clinic-petroleum'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={48} className="mx-auto mb-4 text-clinic-gray-400" />
            <p className="text-white font-medium mb-2">
              Arraste arquivos ou clique para selecionar
            </p>
            <p className="text-sm text-clinic-gray-400">
              Formatos: CSV, XLS, XLSX, XML, PDF
            </p>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Adicionar Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nome"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Nome completo"
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
              />
              <Input
                label="Telefone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
              />
              <Input
                label="Email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => createMutation.mutate(newContact)}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente..."
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
              />
            </div>
            <Search className="text-clinic-gray-400" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered?.map((contact: Contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{contact.name || 'Sem nome'}</p>
                  <p className="text-sm text-clinic-gray-400">
                    {formatPhone(contact.phone)} {contact.email && `• ${contact.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      contact.opt_in_status === 'opted_in'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {contact.opt_in_status === 'opted_in' ? 'Ativo' : 'Pendente'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(contact.id)}
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
            {!filtered?.length && (
              <p className="text-center text-clinic-gray-400 py-8">
                Nenhum paciente encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
