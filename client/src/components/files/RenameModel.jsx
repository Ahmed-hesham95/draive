import React, { useEffect, useState } from 'react'
import { useDrive } from '../../hooks/useDrive'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const RenameModel = ({ item, isOpen, onClose }) => {
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { renameItem } = useDrive()

    useEffect(() => {
        if (item) setName(item.name || "")
    }, [item])

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !item) return;

        setIsLoading(true)
        await renameItem(item, name.trim())
        setIsLoading(false)
        onClose() // تصحيح الحرف الكبير
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Rename ${item?.item_type === "folder" ?
            "Folder" : "File"
        }`}>
            <form className='space-y-4' onSubmit={handleSubmit}>
                <Input 
                    autoFocus
                    required
                    onChange={(e) => setName(e.target.value)} // تصحيح onChange
                    value={name}
                    label="Name"
                />
                <div className='flex items-center justify-end gap-3 pt-2'>
                    <Button variant='ghost' onClick={onClose} type='button'>
                        Cancel
                    </Button>
                    <Button variant='primary' disabled={!name.trim()} type='submit' isLoading={isLoading}> {/* إضافة قوسين trim() */}
                        Rename
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default RenameModel