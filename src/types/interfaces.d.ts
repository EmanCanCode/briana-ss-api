export interface Parent {
    first_name: string;
    last_name: string;
    phone_number: string;
  }
  
  export interface Child {
    id: string;
    first_name: string;
    last_name: string;
    session: Session;
    allergies: string;
    parent: Parent;
  }

  export type Session = 'nursery' | 'younger_kids' | 'older_kids';
  