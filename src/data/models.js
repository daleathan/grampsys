/*
 * Data models
 */
import u  from './utils'
import dt from './time'


class Person
{

  constructor ( json, events )
  {
    this._ = json;
    this.id = json.id;
    this.name = this._name();
    this.dob = this._date(events, 'Birth');
    this.dod = this._date(events, 'Death');
    this.age = this.dob ? dt.yearsDifference( this.dob ) : '';
    this.aad = this.dod ? dt.yearsDifference( this.dob, this.dod ) : '';
    this.gen = this._generationTitle();
  }

  _name ()
  {
    function lname () {
      if (u.isObject(name.surname)) {
        return `${name.surname.prefix||''} ${name.surname['$t']||''}`.trim()
      }
      return name.surname
    }
    const name = u.first(u.toArray(this._.name));
    return `${name.first} ${lname()}`.trim()
  }

  _date ( events, type )
  {
    for (let eventref of u.toArray(this._.eventref)) {
      const hlink = eventref ? eventref.hlink : undefined;
      const event = events.get(hlink) || {};
      if (event.type === type) {
        return event.dateval.val
      }
    }
  }

  _generationTitle ()
  {
    if ( !this.dob ) return;
    const year = parseInt(this.dob.substring(0, 4));
    if      ( year < 1900 ) return 'Previous';
    else if ( year < 1925 ) return 'G.I.';
    else if ( year < 1946 ) return 'Silent / Traditionalist';
    else if ( year < 1965 ) return 'Baby Boomer';
    else if ( year < 1980 ) return 'Generation X';
    else if ( year < 2000 ) return 'Generation Y / Millennial';
    else if ( year < 2010 ) return 'Generation Z / Centennial';
                            return 'Alpha';
  }

}


class Member
{

  constructor ( person, getters )
  {
    this._ = person;
    this.id = person.id;
    this.name = person.name;
    this.dob = person.dob;
    this.dod = person.dod;
    this.age = person.age;
    this.aad = person.aad;
    this.gen = person.gen;
    // this.parents = [];
    this.familys = [...this._familiesGenerator( getters )];
    this.father = this.getFather( person, getters );
    this.mother = this.getMother( person, getters );
  }

  // label ()
  // {
  //   const name = this.name;
  //   const dob = this.dob ? `born ${this.dob}` : '';
  //   return `${name} ${dob}`.trim()
  // }

  // setParents () {
  //   if ( this._ && this._.childof && this._.childof.hlink ) {
  //     this.parents = getFamily( this._.childof.hlink );
  //   }
  // }

  *_familiesGenerator ( getters ) {
    for ( let parentin of u.toArray(this._._.parentin) ) {
      const
        family = getters.familyByHandle( parentin.hlink ),
        children = u.toArray( family ? family.childref : [] ),
        childBranches = children.map( ref => getters.memberByHandle( ref.hlink ) );
      family.children = childBranches.sort( (a, b) => a.age < b.age );
      yield family
    }
  }

  *_childrenGenerator ( getters ) {
    for ( let family of this.familys ) {
      yield* family.children.map( child => new Member(child, getters) )
    }
  }

  _getParents ( person, member, getters ) {
    if ( person._ && person._.childof && person._.childof ) {
      const parents = getters.familyByHandle( person._.childof.hlink );
      if ( parents && parents[member] && parents[member].hlink ) {
        const parent = getters.personByHandle( parents[member].hlink );
        return parent ? parent : null
      }
    }
  }

  getFather ( person, getters ) {
    return this._getParents( person, 'father', getters )
  }

  getMother ( person, getters ) {
    return this._getParents( person, 'mother', getters )
  }

}


export {

  Member,
  Person,

}
