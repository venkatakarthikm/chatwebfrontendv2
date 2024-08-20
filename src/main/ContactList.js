// ContactList.js
import React from 'react';

const ContactList = ({ contacts, onSelectContact }) => {
  return (
    <div className="contact-list">
      {contacts.map(contact => (
        <div 
          key={contact.id} 
          className="contact-item" 
          onClick={() => onSelectContact(contact)}>
          {contact.name}
        </div>
      ))}
    </div>
  );
};

export default ContactList;
